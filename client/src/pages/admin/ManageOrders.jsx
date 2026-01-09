import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [updatingAssignment, setUpdatingAssignment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewFilter, setViewFilter] = useState('all'); // 'all', 'mine', or admin ID
  const [searchQuery, setSearchQuery] = useState('');
  const [orderNotes, setOrderNotes] = useState({});
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(null);

  useEffect(() => {
    loadOrders();
    loadAdmins();
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

  const loadOrderNotes = async (orderId) => {
    try {
      const response = await adminAPI.getOrderNotes(orderId);
      setOrderNotes(prev => ({ ...prev, [orderId]: response.data.notes }));
    } catch (error) {
      console.error('Failed to load notes:', error);
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

  const handleAddNote = async (orderId) => {
    if (!newNote.trim()) return;

    setAddingNote(orderId);
    try {
      await adminAPI.addOrderNote(orderId, newNote);
      setNewNote('');
      loadOrderNotes(orderId);
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    } finally {
      setAddingNote(null);
    }
  };

  const handleDeleteNote = async (orderId, noteId) => {
    if (!confirm('Delete this note?')) return;

    try {
      await adminAPI.deleteOrderNote(noteId);
      loadOrderNotes(orderId);
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note');
    }
  };

  const handleViewDetails = (orderId) => {
    if (selectedOrder === orderId) {
      setSelectedOrder(null);
    } else {
      setSelectedOrder(orderId);
      loadOrderNotes(orderId);
    }
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

  const getArtworkOptionLabel = (option) => {
    const labels = {
      'upload-later': 'Upload Files Later',
      'design-service': 'Use Design Service',
      'use-template': 'Use Academica Template',
      'print-ready': 'Print-Ready Files Provided',
    };
    return labels[option] || option;
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
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <span className="text-xs text-gray-400">+{order.items.length - 3}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span className="font-mono">{order.orderNumber || `#${order.id.toString().slice(0, 8).toUpperCase()}`}</span>
                      <span>•</span>
                      <span>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
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
                      onClick={() => handleViewDetails(order.id)}
                      className={`p-1.5 rounded transition-colors ${
                        selectedOrder === order.id
                          ? 'bg-academica-blue text-white'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title={selectedOrder === order.id ? 'Hide Details' : 'View Details'}
                    >
                      <svg className={`w-5 h-5 transition-transform ${selectedOrder === order.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedOrder === order.id && (
                <div className="px-4 py-5 border-t border-gray-200 bg-gray-50">
                  <div className="grid lg:grid-cols-3 gap-8">
                    {/* School/Contact Information */}
                    <div>
                      <h4 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        School Information
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide">School Name</label>
                          <p className="font-medium text-charcoal">{order.shippingInfo?.schoolName || order.schoolName || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Contact Name</label>
                            <p className="text-gray-900">{order.shippingInfo?.contactName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Position/Title</label>
                            <p className="text-gray-900">{order.shippingInfo?.positionTitle || 'N/A'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide">Principal's Name</label>
                          <p className="text-gray-900">{order.shippingInfo?.principalName || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                            <p className="text-gray-900 break-all">{order.shippingInfo?.email || order.email || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Phone</label>
                            <p className="text-gray-900">{order.shippingInfo?.phone || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-charcoal mb-2">Special Instructions</h4>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">{order.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Admin Notes Section */}
                      <div className="mt-6">
                        <h4 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Admin Notes
                        </h4>

                        {/* Add new note */}
                        <div className="mb-4">
                          <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a note about this order..."
                            rows={2}
                            className="input w-full mb-2"
                          />
                          <button
                            onClick={() => handleAddNote(order.id)}
                            disabled={addingNote === order.id || !newNote.trim()}
                            className="btn btn-primary py-1.5 px-4 text-sm"
                          >
                            {addingNote === order.id ? 'Adding...' : 'Add Note'}
                          </button>
                        </div>

                        {/* Notes list */}
                        <div className="space-y-3">
                          {orderNotes[order.id]?.length > 0 ? (
                            orderNotes[order.id].map((note) => (
                              <div key={note.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="font-medium text-charcoal">{note.adminName}</span>
                                    <span className="text-gray-500 text-sm ml-2">
                                      {new Date(note.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  {note.adminId === user?.id && (
                                    <button
                                      onClick={() => handleDeleteNote(order.id, note.id)}
                                      className="text-gray-400 hover:text-red-500 text-sm"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.note}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No notes yet</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Items - Full Details */}
                    <div className="lg:col-span-2">
                      <h4 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Order Items ({order.items?.length || 0})
                      </h4>

                      <div className="space-y-4">
                        {order.items?.map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            {/* Item Header */}
                            <div className="mb-4 pb-3 border-b border-gray-200">
                              <h5 className="font-semibold text-charcoal text-lg">{item.name}</h5>
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            </div>

                            {/* Selected Options */}
                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                              <div className="mb-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-2">Selected Options:</h6>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {Object.entries(item.selectedOptions).map(([key, value]) => {
                                    // Skip customText and artworkOption - they're displayed separately
                                    if (key === 'customText' || key === 'artworkOption') return null;

                                    return (
                                      <div key={key} className="bg-white rounded px-3 py-2 border border-gray-200">
                                        <span className="text-xs text-gray-500 block capitalize">
                                          {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                        <span className="text-sm font-medium text-charcoal">{value}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Artwork Option */}
                            {item.selectedOptions?.artworkOption && (
                              <div className="mb-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-2">Artwork:</h6>
                                <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {getArtworkOptionLabel(item.selectedOptions.artworkOption)}
                                </div>
                              </div>
                            )}

                            {/* Custom Text Content */}
                            {item.selectedOptions?.customText &&
                             Object.values(item.selectedOptions.customText).some(v => v && v.trim()) && (
                              <div>
                                <h6 className="text-sm font-medium text-gray-700 mb-2">Custom Text Content:</h6>
                                <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                  {item.selectedOptions.customText.headline && (
                                    <div>
                                      <label className="text-xs text-gray-500 uppercase tracking-wide">Headline</label>
                                      <p className="text-charcoal font-medium">{item.selectedOptions.customText.headline}</p>
                                    </div>
                                  )}
                                  {item.selectedOptions.customText.subheadline && (
                                    <div>
                                      <label className="text-xs text-gray-500 uppercase tracking-wide">Subheadline</label>
                                      <p className="text-charcoal">{item.selectedOptions.customText.subheadline}</p>
                                    </div>
                                  )}
                                  {item.selectedOptions.customText.bodyText && (
                                    <div>
                                      <label className="text-xs text-gray-500 uppercase tracking-wide">Body Text</label>
                                      <p className="text-charcoal whitespace-pre-wrap">{item.selectedOptions.customText.bodyText}</p>
                                    </div>
                                  )}
                                  {item.selectedOptions.customText.callToAction && (
                                    <div>
                                      <label className="text-xs text-gray-500 uppercase tracking-wide">Call to Action</label>
                                      <p className="text-charcoal font-medium">{item.selectedOptions.customText.callToAction}</p>
                                    </div>
                                  )}
                                  {item.selectedOptions.customText.contactInfo && (
                                    <div>
                                      <label className="text-xs text-gray-500 uppercase tracking-wide">Contact Information</label>
                                      <p className="text-charcoal whitespace-pre-wrap">{item.selectedOptions.customText.contactInfo}</p>
                                    </div>
                                  )}
                                  {item.selectedOptions.customText.additionalNotes && (
                                    <div>
                                      <label className="text-xs text-gray-500 uppercase tracking-wide">Additional Notes for Designer</label>
                                      <p className="text-charcoal whitespace-pre-wrap italic">{item.selectedOptions.customText.additionalNotes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Order
                    </button>
                    <a
                      href={`mailto:${order.shippingInfo?.email || order.email}?subject=Order ${order.orderNumber || order.id.toString().slice(0, 8).toUpperCase()} Update`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Customer
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
