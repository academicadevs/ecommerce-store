import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'message', label: 'Messages' },
  { value: 'feedback', label: 'Proof Feedback' },
  { value: 'new_order', label: 'New Orders' },
  { value: 'proof_signoff', label: 'Proof Sign-offs' },
];

const typeConfig = {
  message: {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    bg: 'bg-blue-100',
    label: 'Message',
  },
  feedback: {
    icon: (
      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    bg: 'bg-purple-100',
    label: 'Feedback',
  },
  new_order: {
    icon: (
      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    bg: 'bg-green-100',
    label: 'New Order',
  },
  status_change: {
    icon: (
      <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    bg: 'bg-orange-100',
    label: 'Status Change',
  },
  user_signup: {
    icon: (
      <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    bg: 'bg-teal-100',
    label: 'User Signup',
  },
  proof_signoff: {
    icon: (
      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-emerald-100',
    label: 'Proof Sign-off',
  },
  system: {
    icon: (
      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-gray-100',
    label: 'System',
  },
};

function formatTimeAgo(dateString) {
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState(new Set());

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (typeFilter) params.type = typeFilter;
      if (readFilter !== '') params.isRead = readFilter;
      if (search) params.search = search;

      const res = await adminAPI.getNotifications(params);
      setNotifications(res.data.notifications || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
      setSelected(new Set());
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [page, typeFilter, readFilter, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await adminAPI.markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: 1 } : n));
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
    if (notif.type === 'user_signup') {
      navigate('/admin/users');
    } else if (notif.orderId) {
      navigate(`/admin/orders?orderId=${notif.orderId}`);
    } else {
      navigate('/admin/orders');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleBulkMarkRead = async () => {
    if (selected.size === 0) return;
    try {
      await adminAPI.bulkMarkNotificationsRead([...selected]);
      setNotifications(prev => prev.map(n => selected.has(n.id) ? { ...n, isRead: 1 } : n));
      setSelected(new Set());
    } catch (err) {
      console.error('Failed to bulk mark as read:', err);
    }
  };

  const handleBulkMarkUnread = async () => {
    if (selected.size === 0) return;
    try {
      await adminAPI.bulkMarkNotificationsUnread([...selected]);
      setNotifications(prev => prev.map(n => selected.has(n.id) ? { ...n, isRead: 0 } : n));
      setSelected(new Set());
    } catch (err) {
      console.error('Failed to bulk mark as unread:', err);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === notifications.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notifications.map(n => n.id)));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total notification{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-sm text-academica-blue hover:text-academica-blue-600 font-medium"
        >
          Mark All as Read
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-academica-blue"
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={readFilter}
              onChange={e => { setReadFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-academica-blue"
            >
              <option value="">All</option>
              <option value="0">Unread</option>
              <option value="1">Read</option>
            </select>
          </div>
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search notifications..."
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-academica-blue"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-academica-blue text-white rounded text-sm hover:bg-academica-blue-600 transition-colors"
              >
                Search
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-blue-800 font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkMarkRead}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              Mark Read
            </button>
            <button
              onClick={handleBulkMarkUnread}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              Mark Unread
            </button>
          </div>
        </div>
      )}

      {/* Notification list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No notifications found
          </div>
        ) : (
          <>
            {/* Select all header */}
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.size === notifications.length && notifications.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-academica-blue focus:ring-academica-blue"
              />
              <span className="text-xs text-gray-500 font-medium">Select all</span>
            </div>

            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => {
                const config = typeConfig[notif.type] || typeConfig.system;
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 ${!notif.isRead ? 'bg-blue-50/40' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(notif.id)}
                      onChange={() => toggleSelect(notif.id)}
                      className="mt-1 rounded border-gray-300 text-academica-blue focus:ring-academica-blue"
                    />
                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className="flex-1 text-left flex items-start gap-3 min-w-0"
                    >
                      <div className={`flex-shrink-0 w-9 h-9 ${config.bg} rounded-full flex items-center justify-center mt-0.5`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'} line-clamp-1`}>
                              {notif.title}
                            </p>
                            {notif.body && (
                              <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{notif.body}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                            <span className="text-xs text-gray-400 whitespace-nowrap">{formatTimeAgo(notif.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.bg} text-gray-600`}>
                            {config.label}
                          </span>
                          {notif.metadata?.orderNumber && (
                            <span className="text-xs text-gray-400 font-mono">#{notif.metadata.orderNumber}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
