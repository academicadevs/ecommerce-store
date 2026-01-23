import express from 'express';
import db from '../utils/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exporters.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Helper function to parse date range from query
function getDateRange(query) {
  const endDate = query.endDate ? new Date(query.endDate) : new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = query.startDate ? new Date(query.startDate) : new Date();
  if (!query.startDate) {
    startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
  }
  startDate.setHours(0, 0, 0, 0);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startDateFormatted: startDate.toLocaleDateString(),
    endDateFormatted: endDate.toLocaleDateString()
  };
}

// Helper to get previous period for comparison
function getPreviousPeriod(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  prevEnd.setHours(23, 59, 59, 999);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays);
  prevStart.setHours(0, 0, 0, 0);

  return {
    startDate: prevStart.toISOString(),
    endDate: prevEnd.toISOString()
  };
}

// ==================== DASHBOARD ====================

// GET /api/admin/reports/dashboard - Overview KPIs
router.get('/dashboard', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);
    const prevPeriod = getPreviousPeriod(startDate, endDate);

    // Current period stats
    const currentStats = db.prepare(`
      SELECT COUNT(*) as totalRequests
      FROM orders
      WHERE createdAt >= ? AND createdAt <= ?
    `).get(startDate, endDate);

    // Previous period stats for comparison
    const prevStats = db.prepare(`
      SELECT COUNT(*) as totalRequests
      FROM orders
      WHERE createdAt >= ? AND createdAt <= ?
    `).get(prevPeriod.startDate, prevPeriod.endDate);

    // New users in current period
    const newUsersResult = db.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE createdAt >= ? AND createdAt <= ? AND role = 'user'
    `).get(startDate, endDate);

    const prevUsersResult = db.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE createdAt >= ? AND createdAt <= ? AND role = 'user'
    `).get(prevPeriod.startDate, prevPeriod.endDate);

    // Requests by status
    const statusDistribution = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE createdAt >= ? AND createdAt <= ?
      GROUP BY status
    `).all(startDate, endDate);

    // Completed requests count
    const completedRequests = statusDistribution.find(s => s.status === 'completed')?.count || 0;

    // In progress requests
    const inProgressRequests = statusDistribution.find(s => s.status === 'in_progress')?.count || 0;

    // Pending requests (new + waiting_feedback)
    const pendingRequests = statusDistribution
      .filter(s => ['new', 'waiting_feedback', 'waiting_signoff'].includes(s.status))
      .reduce((sum, s) => sum + s.count, 0);

    // Calculate percentage changes
    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    res.json({
      dateRange: { startDate, endDate },
      kpis: {
        totalRequests: currentStats.totalRequests,
        totalRequestsChange: calcChange(currentStats.totalRequests, prevStats.totalRequests),
        completedRequests,
        inProgressRequests,
        pendingRequests,
        newUsers: newUsersResult.count,
        newUsersChange: calcChange(newUsersResult.count, prevUsersResult.count),
        completionRate: currentStats.totalRequests > 0 ? (completedRequests / currentStats.totalRequests) * 100 : 0
      },
      statusDistribution
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// ==================== REQUEST ANALYTICS ====================

// GET /api/admin/reports/orders/volume - Request volume over time
router.get('/orders/volume', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);
    const groupBy = req.query.groupBy || 'day';

    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = "strftime('%Y-W%W', createdAt)";
        break;
      case 'month':
        dateFormat = "strftime('%Y-%m', createdAt)";
        break;
      default:
        dateFormat = "date(createdAt)";
    }

    const volumeData = db.prepare(`
      SELECT
        ${dateFormat} as period,
        COUNT(*) as requestCount
      FROM orders
      WHERE createdAt >= ? AND createdAt <= ?
      GROUP BY ${dateFormat}
      ORDER BY period ASC
    `).all(startDate, endDate);

    res.json({ volumeData, groupBy });
  } catch (error) {
    console.error('Request volume error:', error);
    res.status(500).json({ error: 'Failed to load request volume data' });
  }
});

// GET /api/admin/reports/orders/status-distribution
router.get('/orders/status-distribution', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);

    const distribution = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE createdAt >= ? AND createdAt <= ?
      GROUP BY status
      ORDER BY count DESC
    `).all(startDate, endDate);

    res.json({ distribution });
  } catch (error) {
    console.error('Status distribution error:', error);
    res.status(500).json({ error: 'Failed to load status distribution' });
  }
});

// GET /api/admin/reports/orders/by-admin - Requests by assigned admin
router.get('/orders/by-admin', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);

    const byAdmin = db.prepare(`
      SELECT
        u.id,
        u.contactName as adminName,
        u.email as adminEmail,
        COUNT(o.id) as requestCount,
        SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completedCount,
        SUM(CASE WHEN o.status = 'in_progress' THEN 1 ELSE 0 END) as inProgressCount
      FROM users u
      LEFT JOIN orders o ON o.assignedTo = u.id AND o.createdAt >= ? AND o.createdAt <= ?
      WHERE u.role = 'admin'
      GROUP BY u.id
      ORDER BY requestCount DESC
    `).all(startDate, endDate);

    // Also get unassigned count
    const unassigned = db.prepare(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE assignedTo IS NULL AND createdAt >= ? AND createdAt <= ?
    `).get(startDate, endDate);

    res.json({ byAdmin, unassignedCount: unassigned.count });
  } catch (error) {
    console.error('Requests by admin error:', error);
    res.status(500).json({ error: 'Failed to load requests by admin' });
  }
});

// GET /api/admin/reports/orders/heatmap - Activity heatmap (day of week x hour)
router.get('/orders/heatmap', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);

    const heatmapData = db.prepare(`
      SELECT
        CAST(strftime('%w', createdAt) AS INTEGER) as dayOfWeek,
        CAST(strftime('%H', createdAt) AS INTEGER) as hour,
        COUNT(*) as count
      FROM orders
      WHERE createdAt >= ? AND createdAt <= ?
      GROUP BY dayOfWeek, hour
    `).all(startDate, endDate);

    res.json({ heatmapData });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: 'Failed to load heatmap data' });
  }
});

// ==================== PRODUCT ANALYTICS ====================

// GET /api/admin/reports/products/top-requested
router.get('/products/top-selling', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);
    const limit = parseInt(req.query.limit) || 10;

    // Get all orders in date range and parse items
    const orders = db.prepare(`
      SELECT items FROM orders
      WHERE createdAt >= ? AND createdAt <= ?
    `).all(startDate, endDate);

    // Aggregate product data
    const productStats = {};
    orders.forEach(order => {
      const items = JSON.parse(order.items || '[]');
      items.forEach(item => {
        const productId = item.productId || item.id;
        if (!productStats[productId]) {
          productStats[productId] = {
            productId,
            name: item.name || item.productName || 'Unknown',
            category: item.category || 'Unknown',
            requestCount: 0,
            quantity: 0
          };
        }
        productStats[productId].requestCount += 1;
        productStats[productId].quantity += item.quantity || 1;
      });
    });

    // Sort by request count and get top N
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, limit);

    res.json({ topProducts });
  } catch (error) {
    console.error('Top requested products error:', error);
    res.status(500).json({ error: 'Failed to load top requested products' });
  }
});

// GET /api/admin/reports/products/by-category
router.get('/products/by-category', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);

    // Get all orders and aggregate by category
    const orders = db.prepare(`
      SELECT items FROM orders
      WHERE createdAt >= ? AND createdAt <= ?
    `).all(startDate, endDate);

    const categoryStats = {};
    orders.forEach(order => {
      const items = JSON.parse(order.items || '[]');
      items.forEach(item => {
        const category = item.category || 'Other';
        if (!categoryStats[category]) {
          categoryStats[category] = {
            category,
            requestCount: 0,
            itemCount: 0
          };
        }
        categoryStats[category].requestCount += 1;
        categoryStats[category].itemCount += item.quantity || 1;
      });
    });

    const byCategory = Object.values(categoryStats).sort((a, b) => b.requestCount - a.requestCount);

    res.json({ byCategory });
  } catch (error) {
    console.error('Products by category error:', error);
    res.status(500).json({ error: 'Failed to load products by category' });
  }
});

// ==================== USER ANALYTICS ====================

// GET /api/admin/reports/users/overview
router.get('/users/overview', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);

    // Registration trends
    const registrationTrend = db.prepare(`
      SELECT
        date(createdAt) as date,
        COUNT(*) as count
      FROM users
      WHERE createdAt >= ? AND createdAt <= ? AND role = 'user'
      GROUP BY date(createdAt)
      ORDER BY date ASC
    `).all(startDate, endDate);

    // Users by type
    const byType = db.prepare(`
      SELECT
        userType,
        COUNT(*) as count
      FROM users
      WHERE role = 'user'
      GROUP BY userType
    `).all();

    // Total users
    const totalUsers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'user'`).get();

    // Active users (have placed requests in period)
    const activeUsers = db.prepare(`
      SELECT COUNT(DISTINCT userId) as count
      FROM orders
      WHERE createdAt >= ? AND createdAt <= ?
    `).get(startDate, endDate);

    res.json({
      registrationTrend,
      byType,
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count
    });
  } catch (error) {
    console.error('Users overview error:', error);
    res.status(500).json({ error: 'Failed to load users overview' });
  }
});

// GET /api/admin/reports/schools/top
router.get('/schools/top', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);
    const limit = parseInt(req.query.limit) || 10;

    const topSchools = db.prepare(`
      SELECT
        u.schoolName,
        COUNT(o.id) as requestCount,
        COUNT(DISTINCT o.userId) as uniqueUsers,
        SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completedCount
      FROM orders o
      JOIN users u ON o.userId = u.id
      WHERE o.createdAt >= ? AND o.createdAt <= ?
        AND u.schoolName IS NOT NULL AND u.schoolName != 'N/A'
      GROUP BY u.schoolName
      ORDER BY requestCount DESC
      LIMIT ?
    `).all(startDate, endDate, limit);

    res.json({ topSchools });
  } catch (error) {
    console.error('Top schools error:', error);
    res.status(500).json({ error: 'Failed to load top schools' });
  }
});

// ==================== COMMUNICATIONS ====================

// GET /api/admin/reports/communications/overview
router.get('/communications/overview', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);

    // Message counts by direction
    const messageCounts = db.prepare(`
      SELECT
        direction,
        COUNT(*) as count
      FROM order_communications
      WHERE createdAt >= ? AND createdAt <= ?
      GROUP BY direction
    `).all(startDate, endDate);

    // Most active orders by communication volume
    const mostActiveOrders = db.prepare(`
      SELECT
        o.orderNumber,
        o.id as orderId,
        COUNT(oc.id) as messageCount
      FROM orders o
      JOIN order_communications oc ON o.id = oc.orderId
      WHERE oc.createdAt >= ? AND oc.createdAt <= ?
      GROUP BY o.id
      ORDER BY messageCount DESC
      LIMIT 10
    `).all(startDate, endDate);

    // Proof stats
    const proofStats = db.prepare(`
      SELECT
        COUNT(*) as totalProofs,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvedProofs
      FROM proofs
      WHERE createdAt >= ? AND createdAt <= ?
    `).get(startDate, endDate);

    // Annotation counts
    const annotationCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM proof_annotations pa
      JOIN proofs p ON pa.proofId = p.id
      WHERE pa.createdAt >= ? AND pa.createdAt <= ?
    `).get(startDate, endDate);

    res.json({
      messageCounts,
      mostActiveOrders,
      proofStats: {
        totalProofs: proofStats.totalProofs,
        approvedProofs: proofStats.approvedProofs,
        approvalRate: proofStats.totalProofs > 0 ? (proofStats.approvedProofs / proofStats.totalProofs) * 100 : 0
      },
      annotationCount: annotationCount.count
    });
  } catch (error) {
    console.error('Communications overview error:', error);
    res.status(500).json({ error: 'Failed to load communications overview' });
  }
});

// ==================== STAFF PERFORMANCE ====================

// GET /api/admin/reports/staff/performance
router.get('/staff/performance', (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);

    const staffPerformance = db.prepare(`
      SELECT
        u.id,
        u.contactName as adminName,
        u.email as adminEmail,
        COUNT(o.id) as totalAssigned,
        SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN o.status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN o.status = 'new' THEN 1 ELSE 0 END) as newRequests
      FROM users u
      LEFT JOIN orders o ON o.assignedTo = u.id AND o.createdAt >= ? AND o.createdAt <= ?
      WHERE u.role = 'admin'
      GROUP BY u.id
      ORDER BY totalAssigned DESC
    `).all(startDate, endDate);

    // Add completion rate
    const withRates = staffPerformance.map(staff => ({
      ...staff,
      completionRate: staff.totalAssigned > 0 ? (staff.completed / staff.totalAssigned) * 100 : 0
    }));

    res.json({ staffPerformance: withRates });
  } catch (error) {
    console.error('Staff performance error:', error);
    res.status(500).json({ error: 'Failed to load staff performance' });
  }
});

// ==================== EXPORT ====================

// POST /api/admin/reports/export/:type
router.post('/export/:type', async (req, res) => {
  try {
    const { type } = req.params; // csv, excel, pdf
    const { reportType, data, columns, title, dateRange, summary } = req.body;

    if (!data || !columns) {
      return res.status(400).json({ error: 'Data and columns are required' });
    }

    const options = {
      title: title || 'Report',
      sheetName: reportType || 'Data',
      dateRange,
      summary
    };

    let buffer;
    let contentType;
    let filename;

    switch (type) {
      case 'csv':
        buffer = Buffer.from(exportToCSV(data, columns));
        contentType = 'text/csv';
        filename = `${reportType || 'report'}-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'excel':
        buffer = await exportToExcel(data, columns, options);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${reportType || 'report'}-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'pdf':
        buffer = await exportToPDF(data, columns, options);
        contentType = 'application/pdf';
        filename = `${reportType || 'report'}-${new Date().toISOString().split('T')[0]}.pdf`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type. Use csv, excel, or pdf.' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
