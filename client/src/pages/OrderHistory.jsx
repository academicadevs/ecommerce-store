import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDatePT } from '../utils/dateFormat';

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
  new: 'New Request Received',
  waiting_feedback: 'Waiting for Feedback',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  waiting_signoff: 'Waiting for Sign Off',
  sent_to_print: 'Sent to Print',
  completed: 'Completed',
};

// Get display status for users (hide internal statuses)
const getDisplayStatus = (status) => {
  // Submitted to Kimp360 is internal - show as In Progress to users
  if (status === 'submitted_to_kimp360') return 'in_progress';
  return status;
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Requests</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No requests yet</h2>
          <p className="text-gray-600 mb-8">When you submit requests, they will appear here.</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold text-gray-900">
                        {order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      <span className={`badge ${statusColors[getDisplayStatus(order.status)] || 'badge-info'}`}>
                        {statusLabels[getDisplayStatus(order.status)] || order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Submitted on {formatDatePT(order.createdAt, { month: 'long', hour: undefined, minute: undefined })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Preview of items */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <span key={index} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {item.name}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-sm text-gray-500">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
