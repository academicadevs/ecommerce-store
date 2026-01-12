import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const statusColors = {
  new: 'badge-info',
  waiting_feedback: 'badge-warning',
  in_progress: 'badge-info',
  on_hold: 'badge-warning',
  waiting_signoff: 'badge-info',
  sent_to_print: 'badge-info',
  completed: 'badge-success',
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

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await ordersAPI.getById(id);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
        <Link to="/orders" className="btn btn-primary">
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link to="/orders" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6">
        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </Link>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Order {order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}
              </h1>
              <p className="text-sm text-gray-500">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <span className={`badge ${statusColors[order.status] || 'badge-info'} text-sm px-3 py-1`}>
              {statusLabels[order.status] || order.status}
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Items */}
          <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-3 mb-6">
            {order.items.map((item, index) => {
              const opts = item.selectedOptions || item.options || {};
              return (
                <div key={index} className="py-3 border-b border-gray-100 last:border-0">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {Object.keys(opts).length > 0 && (
                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                      {Object.entries(opts).map(([key, value]) => {
                        if (!value || key === 'customText' || key === 'artworkOption') return null;
                        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                        return <p key={key}>{label}: {value}</p>;
                      })}
                      {opts.artworkOption && (
                        <p>Artwork: {opts.artworkOption === 'use_existing' ? 'Use existing artwork' : opts.artworkOption === 'send_later' ? 'Will send later' : opts.artworkOption.replace(/-/g, ' ')}</p>
                      )}
                      {opts.customText && typeof opts.customText === 'object' && (
                        <>
                          {opts.customText.headline && <p>Headline: {opts.customText.headline}</p>}
                          {opts.customText.subheadline && <p>Subheadline: {opts.customText.subheadline}</p>}
                          {opts.customText.bodyText && <p>Body Text: {opts.customText.bodyText}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          {order.shippingInfo?.isInternalOrder ? 'Contact Information' : 'School Information'}
        </h3>
        <div className="text-gray-600">
          {order.shippingInfo?.isInternalOrder ? (
            <>
              <p className="font-medium text-gray-900">{order.shippingInfo.contactName}</p>
              {order.shippingInfo.department && <p>Department: {order.shippingInfo.department}</p>}
              <p className="mt-3">{order.shippingInfo.phone}</p>
              <p>{order.shippingInfo.email}</p>
              {order.shippingInfo.additionalEmails?.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Also CC'd: {order.shippingInfo.additionalEmails.join(', ')}
                </p>
              )}
              <p className="mt-2 text-sm text-purple-600 font-medium">Internal Academica Order</p>
            </>
          ) : (
            <>
              {order.shippingInfo?.schoolName && (
                <p className="font-medium text-gray-900">{order.shippingInfo.schoolName}</p>
              )}
              <p>{order.shippingInfo?.contactName}</p>
              {order.shippingInfo?.positionTitle && <p>{order.shippingInfo.positionTitle}</p>}
              <p className="mt-3">{order.shippingInfo?.phone}</p>
              <p>{order.shippingInfo?.email}</p>
              {order.shippingInfo?.additionalEmails?.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Also CC'd: {order.shippingInfo.additionalEmails.join(', ')}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
          <p className="text-gray-600">{order.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <Link to="/products" className="btn btn-primary flex-1 text-center py-3">
          Order Again
        </Link>
      </div>
    </div>
  );
}
