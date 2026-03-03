import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OrderDetailModal from '../../components/admin/OrderDetailModal';
import usePolling from '../../hooks/usePolling';
import { formatDateShortPT } from '../../utils/dateFormat';

const statusOptions = ['new', 'gathering_details', 'design_phase', 'submitted_to_kimp360', 'internal_review', 'waiting_feedback', 'waiting_signoff', 'sent_to_print', 'completed', 'on_hold'];

const statusColors = {
  new: 'bg-blue-100 text-blue-800 border-blue-300',
  gathering_details: 'bg-sky-100 text-sky-800 border-sky-300',
  design_phase: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  submitted_to_kimp360: 'bg-pink-100 text-pink-800 border-pink-300',
  internal_review: 'bg-violet-100 text-violet-800 border-violet-300',
  waiting_feedback: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  waiting_signoff: 'bg-purple-100 text-purple-800 border-purple-300',
  sent_to_print: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  on_hold: 'bg-orange-100 text-orange-800 border-orange-300',
};

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

const columnHeaderColors = {
  new: 'bg-blue-500',
  gathering_details: 'bg-sky-500',
  design_phase: 'bg-indigo-500',
  submitted_to_kimp360: 'bg-pink-500',
  internal_review: 'bg-violet-500',
  waiting_feedback: 'bg-yellow-500',
  waiting_signoff: 'bg-purple-500',
  sent_to_print: 'bg-cyan-600',
  completed: 'bg-green-500',
  on_hold: 'bg-orange-500',
};

const assigneePalette = [
  { border: 'border-l-blue-500', dot: 'bg-blue-500', text: 'text-blue-600' },
  { border: 'border-l-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  { border: 'border-l-violet-500', dot: 'bg-violet-500', text: 'text-violet-600' },
  { border: 'border-l-rose-500', dot: 'bg-rose-500', text: 'text-rose-600' },
  { border: 'border-l-amber-500', dot: 'bg-amber-500', text: 'text-amber-600' },
  { border: 'border-l-cyan-500', dot: 'bg-cyan-500', text: 'text-cyan-600' },
  { border: 'border-l-fuchsia-500', dot: 'bg-fuchsia-500', text: 'text-fuchsia-600' },
  { border: 'border-l-lime-600', dot: 'bg-lime-600', text: 'text-lime-700' },
];

function KanbanCard({ order, unreadCount, assigneeColor, isHighlighted, onViewDetails, onDragStart, onDragEnd }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, order)}
      onDragEnd={onDragEnd}
      onClick={() => onViewDetails(order)}
      className={`bg-white rounded-lg border border-gray-300 shadow-sm p-2.5 cursor-grab active:cursor-grabbing hover:border-academica-blue hover:shadow-md transition-all border-l-4 ${
        assigneeColor ? assigneeColor.border : 'border-l-gray-300'
      } ${isHighlighted ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 shadow-md' : ''}`}
    >
      {/* Requester name + unread badges */}
      <div className="flex items-start justify-between gap-1">
        <p className="font-semibold text-sm text-charcoal truncate">
          {order.shippingInfo?.contactName || 'Unknown'}
        </p>
        {unreadCount?.total > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex-shrink-0">
            {unreadCount.messages > 0 && (
              <span title="New messages" className="flex items-center">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="ml-0.5">{unreadCount.messages}</span>
              </span>
            )}
            {unreadCount.messages > 0 && unreadCount.feedback > 0 && (
              <span className="text-red-200">|</span>
            )}
            {unreadCount.feedback > 0 && (
              <span title="New feedback" className="flex items-center">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="ml-0.5">{unreadCount.feedback}</span>
              </span>
            )}
          </span>
        )}
      </div>

      {/* Date requested */}
      <p className="text-xs text-gray-400 mt-0.5">{formatDateShortPT(order.createdAt)}</p>

      {/* Items requested */}
      {order.items?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {order.items.slice(0, 3).map((item, i) => (
            <span key={i} className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded truncate max-w-[7rem]">
              {item.name}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="text-[11px] text-gray-400">+{order.items.length - 3}</span>
          )}
        </div>
      )}

      {/* Assigned to */}
      {order.assignedToName ? (
        <p className={`text-xs mt-2 truncate ${assigneeColor ? assigneeColor.text : 'text-gray-400'}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${assigneeColor ? assigneeColor.dot : 'bg-gray-400'}`} />
          {order.assignedToName}
        </p>
      ) : (
        <p className="text-xs text-gray-300 mt-2 italic">Unassigned</p>
      )}
    </div>
  );
}

export default function ManageOrders() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [updatingAssignment, setUpdatingAssignment] = useState(null);
  const [viewFilter, setViewFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);

  // Drag state
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    loadOrders();
    loadAdmins();
    loadUnreadCounts();
  }, []);

  // Auto-open order modal when ?orderId= is in the URL
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && orders.length > 0 && !isModalOpen) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setHighlightedOrderId(orderId);
        handleViewDetails(order);
        setSearchParams({}, { replace: true });
      }
    }
  }, [orders, searchParams]);

  // Poll every 20s when modal is closed and not dragging
  usePolling(async () => {
    const [ordersRes, countsRes] = await Promise.all([
      adminAPI.getOrders(),
      adminAPI.getUnreadCounts(),
    ]);
    // Skip state update if user is mid-drag
    if (!isDraggingRef.current) {
      setOrders(ordersRes.data.orders);
    }
    setUnreadCounts(countsRes.data.counts || {});
  }, 20000, !isModalOpen);

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
    // Clear highlight if manually clicking a different card
    if (highlightedOrderId && highlightedOrderId !== order.id) {
      setHighlightedOrderId(null);
    }
    setSelectedOrder(order);
    setIsModalOpen(true);
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
    loadUnreadCounts();
  };

  const handleOrderUpdate = async () => {
    loadOrders();
    loadUnreadCounts();
    if (selectedOrder) {
      try {
        const res = await adminAPI.getOrder(selectedOrder.id);
        setSelectedOrder(res.data.order);
      } catch (error) {
        console.error('Failed to refresh selected order:', error);
      }
    }
  };

  // --- Drag-and-drop handlers ---
  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    isDraggingRef.current = true;
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag image semi-transparent
    if (e.target) {
      e.target.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e) => {
    setDraggedOrder(null);
    setDragOverColumn(null);
    isDraggingRef.current = false;
    if (e.target) {
      e.target.style.opacity = '1';
    }
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDragEnter = (e, status) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleColumnDragLeave = (e, status) => {
    // Only clear if actually leaving the column (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(prev => prev === status ? null : prev);
    }
  };

  const handleColumnDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    isDraggingRef.current = false;

    if (!draggedOrder || draggedOrder.status === newStatus) {
      setDraggedOrder(null);
      return;
    }

    const orderId = draggedOrder.id;
    setDraggedOrder(null);

    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    setUpdatingStatus(orderId);
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
      loadOrders(); // Revert to server state
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Check if viewing a specific admin's orders
  const isViewingSpecificAdmin = viewFilter !== 'all' && viewFilter !== 'mine' && viewFilter !== 'unassigned';

  // Filter orders by view filter and search query (no status filter — the board shows all)
  const filteredOrders = orders.filter(order => {
    if (viewFilter === 'mine' && order.assignedTo !== user?.id) return false;
    if (viewFilter === 'unassigned' && order.assignedTo) return false;
    if (isViewingSpecificAdmin && order.assignedTo !== viewFilter) return false;

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

  // Map each admin to a consistent color
  const adminColorMap = useMemo(() => {
    const map = {};
    admins.forEach((admin, i) => {
      map[admin.id] = assigneePalette[i % assigneePalette.length];
    });
    return map;
  }, [admins]);

  // Group filtered orders by status for the Kanban columns
  const ordersByStatus = useMemo(() => {
    const grouped = {};
    statusOptions.forEach(status => { grouped[status] = []; });
    filteredOrders.forEach(order => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });
    return grouped;
  }, [filteredOrders]);

  // Get label for current view filter
  const getViewFilterLabel = () => {
    if (viewFilter === 'all') return 'All Requests';
    if (viewFilter === 'mine') return 'My Requests';
    if (viewFilter === 'unassigned') return 'Unassigned';
    const admin = admins.find(a => a.id === viewFilter);
    return admin ? admin.contactName || admin.email : 'All Requests';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/admin" className="text-gray-500 hover:text-academica-blue text-sm mb-2 inline-block">
          &larr; Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Manage Requests</h1>
            <p className="text-gray-600 mt-1">{filteredOrders.length} of {orders.length} requests {viewFilter !== 'all' && `(${getViewFilterLabel()})`}</p>
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
                placeholder="Search requests..."
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
              <option value="all">All Requests</option>
              <option value="mine">My Requests</option>
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
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 340px)' }}>
        {statusOptions.map((status) => {
          const columnOrders = ordersByStatus[status] || [];
          const isOver = dragOverColumn === status;

          return (
            <div
              key={status}
              id={`kanban-col-${status}`}
              className={`w-52 flex-shrink-0 flex flex-col rounded-lg border border-gray-200 shadow-sm transition-all ${
                isOver ? 'ring-2 ring-academica-blue bg-blue-50' : 'bg-gray-50'
              }`}
              onDragOver={handleColumnDragOver}
              onDragEnter={(e) => handleColumnDragEnter(e, status)}
              onDragLeave={(e) => handleColumnDragLeave(e, status)}
              onDrop={(e) => handleColumnDrop(e, status)}
            >
              {/* Column Header */}
              <div className={`${columnHeaderColors[status]} text-white px-3 py-2.5 rounded-t-lg flex items-center justify-between`}>
                <span className="text-sm font-semibold truncate">{statusLabels[status]}</span>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                  {columnOrders.length}
                </span>
              </div>

              {/* Card Area */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ maxHeight: 'calc(100vh - 420px)' }}>
                {columnOrders.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    {draggedOrder ? 'Drop here' : 'No requests'}
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <KanbanCard
                      key={order.id}
                      order={order}
                      unreadCount={unreadCounts[order.id]}
                      assigneeColor={order.assignedTo ? adminColorMap[order.assignedTo] : null}
                      isHighlighted={highlightedOrderId === order.id}
                      onViewDetails={handleViewDetails}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

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
