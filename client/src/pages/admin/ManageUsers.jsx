import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(userId);
    try {
      await adminAPI.updateUserRole(userId, newRole);
      loadUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update user role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleViewOrders = async (user) => {
    if (selectedUser === user.id) {
      setSelectedUser(null);
      setUserOrders([]);
      return;
    }

    setSelectedUser(user.id);
    setLoadingOrders(true);
    try {
      const response = await adminAPI.getUserOrders(user.id);
      setUserOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to load user orders:', error);
      setUserOrders([]);
    } finally {
      setLoadingOrders(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/admin" className="text-gray-500 hover:text-academica-blue text-sm mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-charcoal">Manage Users</h1>
        <p className="text-gray-600 mt-2">{users.length} registered users</p>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            {/* User Row */}
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* User Info */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-academica-blue-50 rounded-full flex items-center justify-center">
                      <span className="text-academica-blue font-semibold">
                        {user.contactName?.charAt(0) || user.email?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal">{user.contactName || 'No Name'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 ml-13">
                    <span className="font-medium">School:</span> {user.schoolName || 'Not specified'}
                  </p>
                </div>

                {/* Role & Actions */}
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Role</label>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updatingRole === user.id}
                      className={`input py-1.5 px-3 w-28 ${
                        user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Joined</label>
                    <span className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleViewOrders(user)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedUser === user.id
                        ? 'bg-academica-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedUser === user.id ? 'Hide Orders' : 'View Orders'}
                  </button>
                </div>
              </div>
            </div>

            {/* User Orders Panel */}
            {selectedUser === user.id && (
              <div className="border-t border-gray-200 bg-gray-50 p-6">
                <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Order History for {user.schoolName || user.contactName}
                </h3>

                {loadingOrders ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No orders placed yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-semibold text-charcoal">
                                #{order.id.toString().slice(0, 8).toUpperCase()}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.status]}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        {order.items && order.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex flex-wrap gap-2">
                              {order.items.slice(0, 4).map((item, index) => (
                                <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {item.name} (x{item.quantity})
                                </span>
                              ))}
                              {order.items.length > 4 && (
                                <span className="text-xs text-gray-500">
                                  +{order.items.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Link to full order */}
                        <div className="mt-3">
                          <Link
                            to="/admin/orders"
                            className="text-sm text-academica-blue hover:text-academica-blue-600 font-medium"
                          >
                            View Full Details →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Admins have full access to manage products, orders, and users.
          Click "View Orders" to see a user's complete order history.
        </p>
      </div>
    </div>
  );
}
