import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await ordersAPI.getById(orderId);
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Not Found</h2>
        <Link to="/orders" className="btn btn-primary">
          View All Requests
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Banner */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Submitted Successfully!</h1>
        <p className="text-gray-600">
          Thank you for your request. We've sent a confirmation email to{' '}
          <strong>{order.shippingInfo.email}</strong>.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-primary-600 text-white px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-primary-100 text-sm">Request Number</p>
              <p className="font-mono font-bold text-lg">{order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}</p>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-sm">Request Date</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' })}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Items */}
          <h3 className="font-semibold text-gray-900 mb-4">Request Items</h3>
          <div className="space-y-3 mb-6">
            {order.items.map((item, index) => {
              const opts = item.selectedOptions || item.options || {};
              return (
                <div key={index} className="py-2 border-b border-gray-100">
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

          {/* Contact Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">
              {order.shippingInfo?.isInternalOrder ? 'Contact Information' : 'School Information'}
            </h3>
            <div className="text-gray-600">
              {order.shippingInfo?.isInternalOrder ? (
                <>
                  <p className="font-medium text-gray-900">{order.shippingInfo.contactName}</p>
                  {order.shippingInfo.department && <p>Department: {order.shippingInfo.department}</p>}
                  <p className="mt-2">{order.shippingInfo.phone}</p>
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
                  <p className="mt-2">{order.shippingInfo?.phone}</p>
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
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 rounded-lg p-6 mt-6">
        <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>1. Our team will review your request and reach out if we have any questions.</li>
          <li>2. You'll receive updates on your request status via email.</li>
          <li>3. Once your request is ready, we'll coordinate delivery with you.</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Link to="/orders" className="btn btn-primary flex-1 text-center py-3">
          View All Requests
        </Link>
        <Link to="/products" className="btn btn-secondary flex-1 text-center py-3">
          Browse Products
        </Link>
      </div>
    </div>
  );
}
