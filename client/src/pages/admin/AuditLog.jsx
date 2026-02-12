import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import usePolling from '../../hooks/usePolling';
import { formatDatePT } from '../../utils/dateFormat';

const categoryColors = {
  orders: 'bg-blue-100 text-blue-800',
  users: 'bg-green-100 text-green-800',
  auth: 'bg-yellow-100 text-yellow-800',
  proofs: 'bg-purple-100 text-purple-800',
  communications: 'bg-teal-100 text-teal-800',
  products: 'bg-orange-100 text-orange-800',
};

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ category: '', action: '', userId: '', search: '', startDate: '', endDate: '' });
  const [filterOptions, setFilterOptions] = useState({ categories: [], actions: [], actors: [] });
  const [searchInput, setSearchInput] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const searchTimer = useRef(null);

  useEffect(() => {
    loadFilters();
    loadEntries();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [pagination.page, filters]);

  // Debounce search input
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  usePolling(async () => {
    await loadEntries(true);
  }, 30000, true);

  const loadFilters = async () => {
    try {
      const res = await adminAPI.getAuditLogFilters();
      setFilterOptions(res.data);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  const loadEntries = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.category) params.category = filters.category;
      if (filters.action) params.action = filters.action;
      if (filters.userId) params.userId = filters.userId;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await adminAPI.getAuditLog(params);
      setEntries(res.data.entries);
      setPagination(prev => ({ ...prev, ...res.data.pagination }));
    } catch (error) {
      console.error('Failed to load audit log:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ category: '', action: '', userId: '', search: '', startDate: '', endDate: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatAction = (action) => {
    return action.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const fieldLabels = {
    contactName: 'Name', email: 'Email', phone: 'Phone', schoolName: 'School',
    middleName: 'Middle Name', positionTitle: 'Position', department: 'Department',
    principalName: 'Principal', supervisor: 'Supervisor', name: 'Name',
    description: 'Description', category: 'Category', subcategory: 'Subcategory',
    inStock: 'In Stock',
  };

  const formatChangeLines = (changes) => {
    if (!changes || !Array.isArray(changes) || changes.length === 0) return [];
    return changes.map(c => {
      const label = fieldLabels[c.field] || c.field;
      return `${label}: "${c.from || '(empty)'}" → "${c.to || '(empty)'}"`;
    });
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Returns { summary: string, lines: string[] }
  // summary = first line shown when collapsed, lines = all lines when expanded
  const formatDetails = (action, details) => {
    const d = details || {};
    const fmt = (s) => (s || '').replace(/_/g, ' ');

    const itemList = (names) => {
      if (!names) return [];
      return names.split(', ').map((n, i) => `${i + 1}. ${n}`);
    };

    switch (action) {
      // Products
      case 'product.create':
        return { summary: `Created product "${d.name}"${d.category ? ` in ${d.category}` : ''}${d.subcategory ? ` / ${d.subcategory}` : ''}`, lines: [] };
      case 'product.update': {
        const cl = formatChangeLines(d.changes);
        return { summary: `Updated product "${d.name}"${cl.length ? ` — ${cl.length} field(s) changed` : ''}`, lines: cl };
      }
      case 'product.delete':
        return { summary: `Deleted product "${d.name}"${d.category ? ` from ${d.category}` : ''}`, lines: [] };
      // Orders
      case 'order.create': {
        const items = itemList(d.itemNames);
        const summary = `Order #${d.orderNumber || '?'}${d.contactName ? ` for ${d.contactName}` : ''} — ${d.itemCount || 0} item(s)${d.isSpecialRequest ? ' (custom request)' : ''}`;
        return { summary, lines: items };
      }
      case 'order.guest_create':
        return {
          summary: `Guest order #${d.orderNumber || '?'} by ${d.contactName || 'unknown'}`,
          lines: [
            d.email ? `Email: ${d.email}` : null,
            d.schoolName ? `School: ${d.schoolName}` : null,
            d.projectTitle ? `Project: "${d.projectTitle}"` : null,
          ].filter(Boolean)
        };
      case 'order.status_change':
        return { summary: `Order #${d.orderNumber || '?'}${d.contactName ? ` (${d.contactName})` : ''} — ${d.previousStatus ? `${fmt(d.previousStatus)} → ` : ''}${fmt(d.status)}`, lines: [] };
      case 'order.assign':
        return {
          summary: d.adminId === 'unassigned'
            ? `Unassigned order #${d.orderNumber || '?'}${d.contactName ? ` (${d.contactName})` : ''}`
            : `Assigned order #${d.orderNumber || '?'}${d.contactName ? ` (${d.contactName})` : ''} to ${d.adminName || 'admin'}`,
          lines: []
        };
      case 'order.items_update': {
        const items = itemList(d.itemNames);
        const summary = `Order #${d.orderNumber || '?'} — ${d.previousItemCount !== d.itemCount ? `${d.previousItemCount || 0} → ${d.itemCount || 0} item(s)` : `${d.itemCount || 0} item(s)`}`;
        return { summary, lines: items };
      }
      case 'order.shipping_update': {
        const cl = formatChangeLines(d.changes);
        return { summary: `Order #${d.orderNumber || '?'} — updated customer info${cl.length ? ` (${cl.length} field(s))` : ''}`, lines: cl };
      }
      case 'order.emails_update': {
        const emails = d.emails ? d.emails.split(', ') : [];
        return { summary: `Order #${d.orderNumber || '?'} — ${d.emailCount || 0} CC recipient(s)`, lines: emails };
      }
      case 'order.note_add':
        return { summary: `Order #${d.orderNumber || '?'} — added note`, lines: d.notePreview ? [`"${d.notePreview}"`] : [] };
      case 'order.note_delete':
        return { summary: 'Deleted a note from order', lines: [] };
      case 'order.email_send':
        return {
          summary: `Order #${d.orderNumber || '?'} — sent email to ${d.to || 'customer'}`,
          lines: [
            d.subject ? `Subject: "${d.subject}"` : null,
            d.contactName ? `Customer: ${d.contactName}` : null,
            d.attachmentCount ? `Attachments: ${d.attachmentCount}` : null,
          ].filter(Boolean)
        };
      case 'order.comms_mark_read':
        return { summary: `Marked communications as read for order #${d.orderNumber || '?'}${d.contactName ? ` (${d.contactName})` : ''}`, lines: [] };
      // Users
      case 'user.create':
        return {
          summary: `Created ${fmt(d.userType)} user: ${d.contactName || ''}`,
          lines: [
            d.email ? `Email: ${d.email}` : null,
            d.schoolName ? `School: ${d.schoolName}` : null,
            d.department ? `Department: ${d.department}` : null,
            d.positionTitle ? `Position: ${d.positionTitle}` : null,
          ].filter(Boolean)
        };
      case 'user.quick_create':
        return {
          summary: `Quick-created user: ${d.contactName || ''}`,
          lines: [
            d.email ? `Email: ${d.email}` : null,
            d.schoolName ? `School: ${d.schoolName}` : null,
            d.phone ? `Phone: ${d.phone}` : null,
          ].filter(Boolean)
        };
      case 'user.update': {
        const cl = formatChangeLines(d.changes);
        return { summary: `Updated ${d.contactName || d.email || 'user'}${cl.length ? ` — ${cl.length} field(s) changed` : ''}`, lines: cl };
      }
      case 'user.role_change':
        return { summary: `${d.contactName || d.email || 'User'} — role ${d.previousRole ? `${d.previousRole} → ` : ''}${d.role || ''}`, lines: [] };
      case 'user.type_change':
        return { summary: `${d.contactName || d.email || 'User'} — type ${d.previousType ? `${fmt(d.previousType)} → ` : ''}${fmt(d.userType)}`, lines: [] };
      // Auth
      case 'auth.register':
        return {
          summary: `${d.contactName || 'User'} registered as ${fmt(d.userType)}`,
          lines: [
            d.email ? `Email: ${d.email}` : null,
            d.schoolName ? `School: ${d.schoolName}` : null,
          ].filter(Boolean)
        };
      case 'auth.login':
        return { summary: `${d.contactName || d.email || 'User'} logged in${d.userType ? ` as ${fmt(d.userType)}` : ''}`, lines: [] };
      // Proofs
      case 'proof.upload':
        return {
          summary: `Uploaded "${d.title || ''}" v${d.version || 1} for order #${d.orderNumber || '?'}`,
          lines: [
            d.contactName ? `Customer: ${d.contactName}` : null,
            d.emailSent ? 'Notification email sent' : null,
          ].filter(Boolean)
        };
      case 'proof.delete':
        return { summary: `Deleted proof "${d.title || ''}"${d.version ? ` v${d.version}` : ''} from order #${d.orderNumber || '?'}`, lines: [] };
      case 'proof.annotate':
        return {
          summary: `${d.authorName || 'Someone'} left ${d.type || ''} feedback on "${d.proofTitle || ''}"${d.version ? ` v${d.version}` : ''}`,
          lines: [
            d.orderNumber ? `Order: #${d.orderNumber}` : null,
            d.comment ? `Comment: "${d.comment}"` : null,
          ].filter(Boolean)
        };
      case 'proof.annotation_resolve':
        return { summary: `${d.resolvedBy || 'Admin'} resolved annotation`, lines: d.comment ? [`Comment: "${d.comment}"`] : [] };
      // Communications
      case 'communication.inbound_received':
        return {
          summary: `Email from ${d.from || 'unknown'} for order #${d.orderNumber || '?'}`,
          lines: [
            d.contactName ? `Customer: ${d.contactName}` : null,
            d.subject ? `Subject: "${d.subject}"` : null,
            d.hasAttachments ? 'Has attachments' : null,
          ].filter(Boolean)
        };
      // Schools
      case 'school.create':
        return {
          summary: `Created school "${d.name || ''}"`,
          lines: [
            d.principal_name ? `Principal: ${d.principal_name}` : null,
            d.district ? `District: ${d.district}` : null,
            d.city && d.state ? `Location: ${d.city}, ${d.state}` : null,
          ].filter(Boolean)
        };
      default:
        if (!details) return { summary: '-', lines: [] };
        const entries = Object.entries(d).filter(([, v]) => v != null && v !== '' && v !== false && !Array.isArray(v));
        if (entries.length === 0) return { summary: '-', lines: [] };
        return { summary: entries[0] ? `${entries[0][0]}: ${entries[0][1]}` : '-', lines: entries.slice(1).map(([k, v]) => `${k}: ${v}`) };
    }
  };

  const hasActiveFilters = filters.category || filters.action || filters.userId || filters.search || filters.startDate || filters.endDate;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/admin" className="text-sm text-academica-blue hover:underline mb-2 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-1">Track all activity across the platform</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-academica-blue"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-academica-blue"
            >
              <option value="">All Actions</option>
              {filterOptions.actions.map(a => (
                <option key={a} value={a}>{formatAction(a)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <select
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-academica-blue"
            >
              <option value="">All Users</option>
              {filterOptions.actors.map(a => (
                <option key={a.id} value={a.id}>{a.contactName || a.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-academica-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-academica-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search actions, users..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-academica-blue"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex justify-between items-center">
            <span className="text-sm text-gray-500">{pagination.total} results</span>
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {hasActiveFilters ? 'No entries match your filters' : 'No audit log entries yet'}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const { summary, lines } = formatDetails(entry.action, entry.details);
                  const isExpanded = expandedRows.has(entry.id);
                  const hasMore = lines.length > 0;
                  return (
                    <tr key={entry.id} className={`hover:bg-gray-50 ${hasMore ? 'cursor-pointer' : ''}`} onClick={() => hasMore && toggleRow(entry.id)}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 align-top">
                        {formatDatePT(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap align-top">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${categoryColors[entry.category] || 'bg-gray-100 text-gray-800'}`}>
                          {formatAction(entry.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize align-top">
                        {entry.category}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 align-top">
                        {entry.actorName || entry.actorEmail || 'System'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-md align-top">
                        <div className={isExpanded ? '' : 'truncate'}>
                          {summary}
                          {hasMore && !isExpanded && (
                            <span className="ml-1 text-academica-blue text-xs">+{lines.length} more</span>
                          )}
                        </div>
                        {isExpanded && (
                          <div className="mt-1 pl-2 border-l-2 border-gray-200 space-y-0.5">
                            {lines.map((line, i) => (
                              <div key={i} className="text-xs text-gray-500">{line}</div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 font-mono align-top">
                        {entry.ipAddress || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                    className={`px-3 py-1 text-sm border rounded ${
                      pagination.page === pageNum
                        ? 'bg-academica-blue text-white border-academica-blue'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
