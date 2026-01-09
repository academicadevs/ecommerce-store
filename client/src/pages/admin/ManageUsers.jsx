import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

const USER_TYPE_LABELS = {
  school_staff: 'School Staff Member',
  academica_employee: 'Academica Employee',
  admin: 'Admin',
  superadmin: 'Super Admin',
};

const USER_TYPE_COLORS = {
  school_staff: 'bg-green-100 text-green-800 border-green-200',
  academica_employee: 'bg-blue-100 text-blue-800 border-blue-200',
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  superadmin: 'bg-red-100 text-red-800 border-red-200',
};

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(null);
  const [updatingUserType, setUpdatingUserType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [addError, setAddError] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    middleName: '',
    contactName: '',
    userType: 'school_staff',
    schoolName: '',
    principalName: '',
    positionTitle: '',
    department: '',
    phone: '',
  });

  // Edit user modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [editError, setEditError] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');

  const isSuperAdmin = currentUser?.userType === 'superadmin';

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.contactName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.schoolName?.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query) ||
      user.positionTitle?.toLowerCase().includes(query) ||
      USER_TYPE_LABELS[user.userType]?.toLowerCase().includes(query)
    );
  });

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

  const handleUserTypeChange = async (userId, newUserType) => {
    setUpdatingUserType(userId);
    try {
      await adminAPI.updateUserType(userId, newUserType);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user type:', error);
      alert('Failed to update user type');
    } finally {
      setUpdatingUserType(null);
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

  const resetNewUserForm = () => {
    setNewUser({
      email: '',
      password: '',
      middleName: '',
      contactName: '',
      userType: 'school_staff',
      schoolName: '',
      principalName: '',
      positionTitle: '',
      department: '',
      phone: '',
    });
    setAddError('');
  };

  // Check if user type is staff (uses middle name as password)
  const isStaffUserType = (userType) => userType === 'school_staff' || userType === 'academica_employee';

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddingUser(true);

    try {
      await adminAPI.createUser(newUser);
      setShowAddModal(false);
      resetNewUserForm();
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      setAddError(error.response?.data?.error || 'Failed to create user');
    } finally {
      setAddingUser(false);
    }
  };

  const canEditUser = (user) => {
    // Superadmins can edit everyone
    if (isSuperAdmin) return true;
    // Admins cannot edit superadmins
    if (user.userType === 'superadmin') return false;
    return true;
  };

  const handleOpenEditModal = (user) => {
    setEditUser({
      id: user.id,
      email: user.email,
      contactName: user.contactName,
      userType: user.userType,
      middleName: user.middleName || '',
      schoolName: user.schoolName || '',
      principalName: user.principalName || '',
      positionTitle: user.positionTitle || '',
      department: user.department || '',
      phone: user.phone || '',
    });
    setEditPassword('');
    setEditConfirmPassword('');
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditError('');

    const isStaff = isStaffUserType(editUser.userType);

    // Validate password if provided (for admin/superadmin only)
    if (!isStaff && editPassword) {
      if (editPassword !== editConfirmPassword) {
        setEditError('Passwords do not match');
        return;
      }
      if (editPassword.length < 6) {
        setEditError('Password must be at least 6 characters');
        return;
      }
    }

    setEditingUser(true);

    try {
      // Update profile (includes middleName for staff users)
      await adminAPI.updateUser(editUser.id, {
        email: editUser.email,
        contactName: editUser.contactName,
        middleName: isStaff ? editUser.middleName : undefined,
        schoolName: editUser.schoolName,
        principalName: editUser.principalName,
        positionTitle: editUser.positionTitle,
        department: editUser.department,
        phone: editUser.phone,
      });

      // Update password if provided (for admin/superadmin only)
      if (!isStaff && editPassword) {
        await adminAPI.updateUserPassword(editUser.id, editPassword);
      }

      setShowEditModal(false);
      setEditUser(null);
      setEditPassword('');
      setEditConfirmPassword('');
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      setEditError(error.response?.data?.error || 'Failed to update user');
    } finally {
      setEditingUser(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Manage Users</h1>
            <p className="text-gray-600 mt-2">
              {filteredUsers.length === users.length
                ? `${users.length} registered users`
                : `${filteredUsers.length} of ${users.length} users`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-charcoal">{user.contactName || 'No Name'}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${USER_TYPE_COLORS[user.userType] || USER_TYPE_COLORS.school_staff}`}>
                          {USER_TYPE_LABELS[user.userType] || 'School Staff Member'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-gray-600 ml-13 text-sm space-y-1">
                    {user.positionTitle && (
                      <p><span className="font-medium">Position:</span> {user.positionTitle}</p>
                    )}
                    {(user.userType === 'school_staff' || !user.userType) && (
                      <>
                        <p><span className="font-medium">School:</span> {user.schoolName || 'Not specified'}</p>
                        {user.principalName && (
                          <p><span className="font-medium">Principal:</span> {user.principalName}</p>
                        )}
                      </>
                    )}
                    {user.userType === 'academica_employee' && (
                      <p><span className="font-medium">Department:</span> {user.department || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                {/* User Type & Actions */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Only Super Admins can change user types */}
                  {isSuperAdmin && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">User Type</label>
                      <select
                        value={user.userType || 'school_staff'}
                        onChange={(e) => handleUserTypeChange(user.id, e.target.value)}
                        disabled={updatingUserType === user.id}
                        className={`input py-1.5 px-3 w-44 ${
                          user.userType === 'admin' || user.userType === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''
                        }`}
                      >
                        <option value="school_staff">School Staff Member</option>
                        <option value="academica_employee">Academica Employee</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>
                  )}

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

                  {canEditUser(user) && (
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      title="Edit User"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
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
                                {order.orderNumber || `#${order.id.toString().slice(0, 8).toUpperCase()}`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                {statusLabels[order.status] || order.status}
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal">Add New User</h2>
              <button
                onClick={() => { setShowAddModal(false); resetNewUserForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {addError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Type *</label>
                <select
                  value={newUser.userType}
                  onChange={(e) => setNewUser({ ...newUser, userType: e.target.value })}
                  className="input w-full"
                >
                  <option value="school_staff">School Staff Member</option>
                  <option value="academica_employee">Academica Employee</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                  {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                </select>
              </div>

              {/* Info box for staff users */}
              {isStaffUserType(newUser.userType) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Note:</span> Staff members use their middle name as their password.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    className="input w-full"
                    placeholder="user@example.com"
                  />
                </div>
                {isStaffUserType(newUser.userType) ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name *</label>
                    <input
                      type="text"
                      value={newUser.middleName}
                      onChange={(e) => setNewUser({ ...newUser, middleName: e.target.value })}
                      required
                      minLength={2}
                      className="input w-full"
                      placeholder="Used as password"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      minLength={6}
                      className="input w-full"
                      placeholder="Min 6 characters"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  value={newUser.contactName}
                  onChange={(e) => setNewUser({ ...newUser, contactName: e.target.value })}
                  required
                  className="input w-full"
                  placeholder="John Smith"
                />
              </div>

              {(newUser.userType === 'school_staff' || newUser.userType === 'admin' || newUser.userType === 'superadmin') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <input
                      type="text"
                      value={newUser.schoolName}
                      onChange={(e) => setNewUser({ ...newUser, schoolName: e.target.value })}
                      className="input w-full"
                      placeholder="Academica Charter School"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Principal's Name</label>
                    <input
                      type="text"
                      value={newUser.principalName}
                      onChange={(e) => setNewUser({ ...newUser, principalName: e.target.value })}
                      className="input w-full"
                      placeholder="Dr. Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position/Title</label>
                    <input
                      type="text"
                      value={newUser.positionTitle}
                      onChange={(e) => setNewUser({ ...newUser, positionTitle: e.target.value })}
                      className="input w-full"
                      placeholder="Marketing Coordinator"
                    />
                  </div>
                </>
              )}

              {newUser.userType === 'academica_employee' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="input w-full"
                    placeholder="Marketing"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="input w-full"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetNewUserForm(); }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="btn btn-primary"
                >
                  {addingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal">Edit User Profile</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditUser(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              {editError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {editError}
                </div>
              )}

              <div className="bg-gray-50 px-4 py-2 rounded-lg">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${USER_TYPE_COLORS[editUser.userType] || USER_TYPE_COLORS.school_staff}`}>
                  {USER_TYPE_LABELS[editUser.userType] || 'School Staff Member'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  required
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  value={editUser.contactName}
                  onChange={(e) => setEditUser({ ...editUser, contactName: e.target.value })}
                  required
                  className="input w-full"
                />
              </div>

              {(editUser.userType === 'school_staff' || editUser.userType === 'admin' || editUser.userType === 'superadmin') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <input
                      type="text"
                      value={editUser.schoolName}
                      onChange={(e) => setEditUser({ ...editUser, schoolName: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Principal's Name</label>
                    <input
                      type="text"
                      value={editUser.principalName}
                      onChange={(e) => setEditUser({ ...editUser, principalName: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position/Title</label>
                    <input
                      type="text"
                      value={editUser.positionTitle}
                      onChange={(e) => setEditUser({ ...editUser, positionTitle: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </>
              )}

              {editUser.userType === 'academica_employee' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editUser.department}
                    onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
                    className="input w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editUser.phone}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  className="input w-full"
                />
              </div>

              {/* Middle Name Section (for staff users) */}
              {isStaffUserType(editUser.userType) && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Note:</span> This user's password is their middle name.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name (Password)</label>
                    <input
                      type="text"
                      value={editUser.middleName}
                      onChange={(e) => setEditUser({ ...editUser, middleName: e.target.value })}
                      className="input w-full"
                      placeholder="User's middle name"
                    />
                    <p className="text-xs text-gray-500 mt-1">Changing this will update the user's password</p>
                  </div>
                </div>
              )}

              {/* Password Section (for admin/superadmin users - only visible to superadmins) */}
              {!isStaffUserType(editUser.userType) && isSuperAdmin && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Change Password</p>
                  <p className="text-xs text-gray-500 mb-3">Leave blank to keep current password</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="input w-full"
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={editConfirmPassword}
                        onChange={(e) => setEditConfirmPassword(e.target.value)}
                        className="input w-full"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditUser(null); }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingUser}
                  className="btn btn-primary"
                >
                  {editingUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
