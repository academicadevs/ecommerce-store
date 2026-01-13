import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OrderDetailModal from '../../components/admin/OrderDetailModal';

const statusOptions = ['new', 'waiting_feedback', 'in_progress', 'on_hold', 'waiting_signoff', 'sent_to_print', 'completed'];

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  waiting_feedback: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  on_hold: 'bg-orange-100 text-orange-800',
  waiting_signoff: 'bg-purple-100 text-purple-800',
  sent_to_print: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels = {
  new: 'New',
  waiting_feedback: 'Waiting for Feedback',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  waiting_signoff: 'Waiting for Sign Off',
  sent_to_print: 'Sent to Print',
  completed: 'Completed',
};

export default function ManageOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [updatingAssignment, setUpdatingAssignment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewFilter, setViewFilter] = useState('all'); // 'all', 'mine', or admin ID
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    loadOrders();
    loadAdmins();
    loadUnreadCounts();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await adminAPI.getOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await adminAPI.getAdmins();
      setAdmins(response.data.admins);
    } catch (error) {
      console.error('Failed to load admins:', error);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const response = await adminAPI.getUnreadCounts();
      setUnreadCounts(response.data.counts || {});
    } catch (error) {
      console.error('Failed to load unread counts:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAssignmentChange = async (orderId, adminId) => {
    setUpdatingAssignment(orderId);
    try {
      await adminAPI.assignOrder(orderId, adminId || null);
      loadOrders();
    } catch (error) {
      console.error('Failed to assign order:', error);
      alert('Failed to assign order');
    } finally {
      setUpdatingAssignment(null);
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    // Mark notifications as read when viewing order
    try {
      await adminAPI.markNotificationsRead(order.id);
      loadUnreadCounts();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    loadUnreadCounts(); // Refresh counts after closing modal
  };

  const handleOrderUpdate = () => {
    loadOrders();
    loadUnreadCounts();
  };

  // Check if viewing a specific admin's orders (not 'all', 'mine', or 'unassigned')
  const isViewingSpecificAdmin = viewFilter !== 'all' && viewFilter !== 'mine' && viewFilter !== 'unassigned';

  // Filter orders by view filter, status and search query
  const filteredOrders = orders.filter(order => {
    // View filter (all, mine, or specific admin ID)
    if (viewFilter === 'mine' && order.assignedTo !== user?.id) return false;
    if (viewFilter === 'unassigned' && order.assignedTo) return false;
    if (isViewingSpecificAdmin && order.assignedTo !== viewFilter) return false;

    // Hide completed orders by default (when viewing 'all' or 'unassigned')
    // Show completed when: status filter is 'completed', or viewing specific admin, or viewing 'mine'
    if (order.status === 'completed') {
      const showCompleted = filterStatus === 'completed' || isViewingSpecificAdmin || viewFilter === 'mine';
      if (!showCompleted) return false;
    }

    // Status filter
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const orderId = order.id?.toString().toLowerCase() || '';
      const orderNumber = order.orderNumber?.toLowerCase() || '';
      const schoolName = order.shippingInfo?.schoolName?.toLowerCase() || order.schoolName?.toLowerCase() || '';
      const contactName = order.shippingInfo?.contactName?.toLowerCase() || '';
      const email = order.shippingInfo?.email?.toLowerCase() || order.email?.toLowerCase() || '';
      const assignedTo = order.assignedToName?.toLowerCase() || '';

      return (
        orderId.includes(query) ||
        orderNumber.includes(query) ||
        schoolName.includes(query) ||
        contactName.includes(query) ||
        email.includes(query) ||
        assignedTo.includes(query)
      );
    }

    return true;
  });

  // Get label for current view filter
  const getViewFilterLabel = () => {
    if (viewFilter === 'all') return 'All Orders';
    if (viewFilter === 'mine') return 'My Orders';
    if (viewFilter === 'unassigned') return 'Unassigned';
    const admin = admins.find(a => a.id === viewFilter);
    return admin ? admin.contactName || admin.email : 'All Orders';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/admin" className="text-gray-500 hover:text-academica-blue text-sm mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Manage Orders</h1>
            <p className="text-gray-600 mt-1">{filteredOrders.length} of {orders.length} orders {viewFilter !== 'all' && `(${getViewFilterLabel()})`}</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-48"
              />
            </div>

            {/* View Filter */}
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value)}
              className="input py-2 w-44"
            >
              <option value="all">All Orders</option>
              <option value="mine">My Orders</option>
              <option value="unassigned">Unassigned</option>
              {admins.length > 0 && (
                <optgroup label="By Admin">
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.contactName || admin.email}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input py-2 w-40"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {statusOptions.map((status) => {
          const count = orders.filter(o => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                filterStatus === status
                  ? 'border-academica-blue bg-academica-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl font-bold text-charcoal">{count}</div>
              <div className="text-xs text-gray-600">{statusLabels[status]}</div>
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-charcoal mb-1">
            {viewFilter === 'mine' ? 'No orders assigned to you' : filterStatus === 'all' ? 'No orders yet' : `No ${statusLabels[filterStatus] || filterStatus} orders`}
          </h3>
          <p className="text-gray-500">
            {viewFilter === 'mine'
              ? 'Orders assigned to you will appear here.'
              : filterStatus === 'all'
              ? 'Orders will appear here when customers place them.'
              : 'Try selecting a different filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              {/* Order Row */}
              <div className="px-4 py-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Contact & School */}
                  <div className="lg:w-56 flex-shrink-0">
                    <p className="font-semibold text-charcoal truncate">
                      {order.shippingInfo?.contactName || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {order.shippingInfo?.orderedBy === 'academica_employee'
                        ? `Academica - ${order.shippingInfo?.department || 'Corporate'}`
                        : order.shippingInfo?.schoolName || order.schoolName || 'No school'}
                    </p>
                  </div>

                  {/* Items */}
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      {order.items?.slice(0, 3).map((item, index) => (
                        <span key={index} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {item.name}
                        </span>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <span className="text-xs text-gray-400">+{order.items.length - 3}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span className="font-mono">{order.orderNumber || `#${order.id.toString().slice(0, 8).toUpperCase()}`}</span>
                      {unreadCounts[order.id]?.total > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                          {unreadCounts[order.id].messages > 0 && (
                            <span title="New messages" className="flex items-center">
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                              <span className="ml-0.5">{unreadCounts[order.id].messages}</span>
                            </span>
                          )}
                          {unreadCounts[order.id].messages > 0 && unreadCounts[order.id].feedback > 0 && (
                            <span className="text-red-200">|</span>
                          )}
                          {unreadCounts[order.id].feedback > 0 && (
                            <span title="New feedback" className="flex items-center">
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <span className="ml-0.5">{unreadCounts[order.id].feedback}</span>
                            </span>
                          )}
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}</span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={order.assignedTo || ''}
                      onChange={(e) => handleAssignmentChange(order.id, e.target.value)}
                      disabled={updatingAssignment === order.id}
                      className="input py-1 px-2 text-sm w-32"
                    >
                      <option value="">Unassigned</option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.contactName || admin.email}
                        </option>
                      ))}
                    </select>

                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingStatus === order.id}
                      className={`input py-1 px-2 text-sm w-44 ${statusColors[order.status]}`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleViewDetails(order)}
                      className="px-3 py-1.5 text-sm bg-academica-blue text-white rounded hover:bg-academica-blue-dark transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleOrderUpdate}
        admins={admins}
        user={user}
      />
    </div>
  );
}
