import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadOrders();
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

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

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
            <p className="text-gray-600 mt-1">{orders.length} total orders</p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input py-2 w-40"
            >
              <option value="all">All Orders</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
              <div className="text-sm text-gray-600 capitalize">{status}</div>
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
            {filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus} orders`}
          </h3>
          <p className="text-gray-500">
            {filterStatus === 'all'
              ? 'Orders will appear here when customers place them.'
              : 'Try selecting a different filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              {/* Order Header */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold text-charcoal text-lg">
                        Order #{order.id.toString().slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Item Count */}
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingStatus === order.id}
                      className="input py-2 w-36"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        selectedOrder === order.id
                          ? 'bg-academica-blue text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {selectedOrder === order.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedOrder === order.id && (
                <div className="p-6">
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
                      href={`mailto:${order.shippingInfo?.email || order.email}?subject=Order ${order.id.toString().slice(0, 8).toUpperCase()} Update`}
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
