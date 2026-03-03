import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import usePolling from '../../hooks/usePolling';
import { formatDateOnlyPT } from '../../utils/dateFormat';

const statusLabels = {
  new: 'New Request Received',
  gathering_details: 'Gathering Project Details',
  design_phase: 'Design Phase',
  submitted_to_kimp360: 'Submitted to Kimp360',
  internal_review: 'Internal Review',
  waiting_feedback: 'Waiting for Feedback',
  waiting_signoff: 'Waiting for Sign Off',
  sent_to_print: 'Sent to Print / Third-Party',
  completed: 'Completed',
  on_hold: 'On Hold',
};

const statusBadgeClass = {
  new: 'badge-info',
  gathering_details: 'badge-info',
  design_phase: 'badge-info',
  submitted_to_kimp360: 'badge-info',
  internal_review: 'badge-info',
  waiting_feedback: 'badge-warning',
  waiting_signoff: 'badge-info',
  sent_to_print: 'badge-info',
  completed: 'badge-success',
  on_hold: 'badge-warning',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadStats();
    loadNotifications();
    if (isSuperAdmin) loadRecentActivity();
  }, []);

  // Poll every 30s
  usePolling(async () => {
    const promises = [
      adminAPI.getStats(),
      adminAPI.getNotificationsBell(),
    ];
    if (isSuperAdmin) promises.push(adminAPI.getAuditLogRecent(8));
    const results = await Promise.all(promises);
    setStats(results[0].data.stats);
    setNotifications(results[1].data.notifications || []);
    setUnreadCount(results[1].data.unreadCount || 0);
    if (isSuperAdmin && results[2]) setRecentActivity(results[2].data.entries || []);
  }, 30000, true);

  const loadStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const response = await adminAPI.getAuditLogRecent(8);
      setRecentActivity(response.data.entries || []);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await adminAPI.getNotificationsBell();
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateOnlyPT(dateString);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalUnreadCount = unreadCount;

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'bg-blue-500',
      link: '/admin/products',
    },
    {
      title: 'Active Requests',
      value: stats?.activeOrders || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'bg-green-500',
      link: '/admin/orders',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-purple-500',
      link: '/admin/users',
    },
    {
      title: 'Unread Notifications',
      value: totalUnreadCount,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      color: totalUnreadCount > 0 ? 'bg-red-500' : 'bg-gray-400',
      link: '/admin/notifications',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your store's performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} text-white p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Guest User Alert */}
      {stats?.guestUserCount > 0 && (
        <Link
          to="/admin/users"
          className="block bg-orange-50 border border-orange-200 rounded-lg px-4 py-4 mb-8 hover:bg-orange-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800">
                {stats.guestUserCount} Quick Added user{stats.guestUserCount !== 1 ? 's' : ''} need{stats.guestUserCount === 1 ? 's' : ''} attention
              </p>
              <p className="text-sm text-orange-700 mt-0.5">Click to manage incomplete user profiles</p>
            </div>
            <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      )}

      {/* Quick Actions */}
      <div className={`grid gap-4 mb-8 ${isSuperAdmin ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
        <Link
          to="/admin/products"
          className="bg-white rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Products</p>
            <p className="text-xs text-gray-500 truncate">Add, edit, or remove</p>
          </div>
        </Link>

        <Link
          to="/admin/orders"
          className="bg-white rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="bg-green-100 text-green-600 p-2 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Requests</p>
            <p className="text-xs text-gray-500 truncate">Process and track</p>
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="bg-purple-100 text-purple-600 p-2 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Users</p>
            <p className="text-xs text-gray-500 truncate">Manage accounts</p>
          </div>
        </Link>

        <Link
          to="/admin/reports"
          className="bg-white rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="bg-orange-100 text-orange-600 p-2 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Reports</p>
            <p className="text-xs text-gray-500 truncate">Performance metrics</p>
          </div>
        </Link>

        {isSuperAdmin && (
          <Link
            to="/admin/audit-log"
            className="bg-white rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Audit Log</p>
              <p className="text-xs text-gray-500 truncate">Platform activity</p>
            </div>
          </Link>
        )}
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              New Activity
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
            <Link to="/admin/notifications" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {notifications.map((notif) => {
              const iconConfig = {
                message: { bg: 'bg-blue-100', color: 'text-blue-600', path: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                feedback: { bg: 'bg-purple-100', color: 'text-purple-600', path: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
                new_order: { bg: 'bg-green-100', color: 'text-green-600', path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                status_change: { bg: 'bg-orange-100', color: 'text-orange-600', path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
                user_signup: { bg: 'bg-teal-100', color: 'text-teal-600', path: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
                proof_signoff: { bg: 'bg-emerald-100', color: 'text-emerald-600', path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              };
              const ic = iconConfig[notif.type] || { bg: 'bg-gray-100', color: 'text-gray-600', path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
              const navTo = notif.type === 'user_signup' ? '/admin/users' : notif.orderId ? `/admin/orders?orderId=${notif.orderId}` : '/admin/orders';

              return (
                <Link
                  key={notif.id}
                  to={navTo}
                  className={`block px-6 py-4 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 ${ic.bg} rounded-full flex items-center justify-center`}>
                      <svg className={`w-4 h-4 ${ic.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ic.path} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${!notif.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                          {notif.title}
                          {notif.metadata?.orderNumber && (
                            <span className="font-mono text-gray-500 ml-2 font-normal">#{notif.metadata.orderNumber}</span>
                          )}
                        </p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatTimeAgo(notif.createdAt)}</span>
                      </div>
                      {notif.body && (
                        <p className="text-sm text-gray-600 truncate mt-0.5">{notif.body}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity + Recent Requests side by side */}
      <div className={`grid gap-6 ${isSuperAdmin ? 'lg:grid-cols-2' : ''}`}>
        {/* Recent Activity (Superadmin only) */}
        {isSuperAdmin && (
          <div className="bg-white rounded-lg shadow-sm self-start">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Recent Activity
              </h2>
              <Link to="/admin/audit-log" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentActivity.length > 0 ? recentActivity.map((entry) => (
                <div key={entry.id} className="px-6 py-3 flex items-center gap-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                    entry.category === 'orders' ? 'bg-blue-500' :
                    entry.category === 'users' ? 'bg-green-500' :
                    entry.category === 'auth' ? 'bg-yellow-500' :
                    entry.category === 'proofs' ? 'bg-purple-500' :
                    entry.category === 'communications' ? 'bg-teal-500' :
                    entry.category === 'products' ? 'bg-orange-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      <span className="font-medium">{entry.actorName || entry.actorEmail || 'System'}</span>
                      {' '}
                      <span className="text-gray-500">{entry.action.replace(/[._]/g, ' ')}</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatTimeAgo(entry.createdAt)}</span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-gray-500">No activity yet</div>
              )}
            </div>
          </div>
        )}

        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow-sm self-start">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
            <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            {stats?.recentOrders?.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate('/admin/orders')}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm">{order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{order.schoolName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${statusBadgeClass[order.status] || 'badge-info'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {formatDateOnlyPT(order.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No requests yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
