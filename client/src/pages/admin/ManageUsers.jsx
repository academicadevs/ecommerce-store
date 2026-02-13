import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import usePolling from '../../hooks/usePolling';
import SchoolsTab from '../../components/admin/SchoolsTab';
import OfficesTab from '../../components/admin/OfficesTab';
import SchoolDropdown from '../../components/SchoolDropdown';
import OfficeDropdown from '../../components/OfficeDropdown';
import { formatDateOnlyPT, formatDatePT } from '../../utils/dateFormat';

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  waiting_feedback: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  on_hold: 'bg-orange-100 text-orange-800',
  waiting_signoff: 'bg-purple-100 text-purple-800',
  submitted_to_kimp360: 'bg-pink-100 text-pink-800',
  sent_to_print: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels = {
  new: 'New Request Received',
  waiting_feedback: 'Waiting for Feedback',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  waiting_signoff: 'Waiting for Sign Off',
  submitted_to_kimp360: 'Submitted to Kimp360',
  sent_to_print: 'Sent to Print',
  completed: 'Completed',
};

const USER_TYPE_LABELS = {
  school_staff: 'School Staff Member',
  academica_employee: 'Academica Employee',
  admin: 'Admin',
  superadmin: 'Super Admin',
  guest: 'Quick Added',
};

const USER_TYPE_COLORS = {
  school_staff: 'bg-green-100 text-green-800 border-green-200',
  academica_employee: 'bg-blue-100 text-blue-800 border-blue-200',
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  superadmin: 'bg-red-100 text-red-800 border-red-200',
  guest: 'bg-orange-100 text-orange-800 border-orange-200',
};

const USER_STATUS_BADGES = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-600 border-gray-300' },
  blocked: { label: 'Blocked', className: 'bg-red-100 text-red-700 border-red-200' },
  deleted: { label: 'Deleted', className: 'bg-gray-200 text-gray-500 border-gray-300' },
};

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'schools', or 'offices'
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
    contactName: '',
    userType: 'school_staff',
    school_id: '',
    schoolName: '',
    principalName: '',
    supervisor: '',
    positionTitle: '',
    department: '',
    office_id: '',
    phone: '',
  });

  // Edit user modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [editError, setEditError] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');

  // Guest conversion state
  const [pendingTypeChange, setPendingTypeChange] = useState(null); // { userId, fromType, toType }

  // Status management state
  const [statusFilter, setStatusFilter] = useState('active');
  const [actionMenuUser, setActionMenuUser] = useState(null); // user id for open action menu
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null); // user object
  const [blockReason, setBlockReason] = useState('');
  const [blockError, setBlockError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { type, user, message }

  const isSuperAdmin = currentUser?.userType === 'superadmin';
  const guestUserCount = users.filter(u => u.userType === 'guest').length;

  // Filter users based on search query and status filter
  const filteredUsers = users.filter(user => {
    // Status filter
    if (statusFilter !== 'all' && user.status !== statusFilter) return false;

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

  // Poll every 30s
  usePolling(async () => {
    const response = await adminAPI.getUsers();
    setUsers(response.data.users);
  }, 30000, true);

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
    // Check if converting FROM guest — intercept and open edit modal
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.userType === 'guest' && newUserType !== 'guest') {
      setPendingTypeChange({ userId, fromType: 'guest', toType: newUserType });
      // Open edit modal pre-populated for target type
      const cleanEmail = targetUser.email || '';
      setEditUser({
        id: targetUser.id,
        email: cleanEmail || '',
        contactName: targetUser.contactName || '',
        userType: newUserType, // Set to TARGET type so correct fields render
        school_id: targetUser.school_id || '',
        schoolName: targetUser.schoolName === 'N/A' ? '' : (targetUser.schoolName || ''),
        principalName: targetUser.principalName || '',
        supervisor: targetUser.supervisor || '',
        positionTitle: targetUser.positionTitle || '',
        department: targetUser.department || '',
        office_id: targetUser.office_id || '',
        phone: targetUser.phone || '',
        originalUserType: 'guest', // Track that this is a conversion
      });
      setEditPassword('');
      setEditConfirmPassword('');
      setEditError('');
      setShowEditModal(true);
      return;
    }

    // Non-guest: direct type change
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
      contactName: '',
      userType: 'school_staff',
      school_id: '',
      schoolName: '',
      principalName: '',
      supervisor: '',
      positionTitle: '',
      department: '',
      office_id: '',
      phone: '',
    });
    setAddError('');
  };

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

  const handleArchiveUser = (user) => {
    setConfirmAction({
      type: 'archive',
      user,
      message: `Archive ${user.contactName}? They will no longer be able to log in.`
    });
    setActionMenuUser(null);
  };

  const handleBlockUser = (user) => {
    setBlockTarget(user);
    setBlockReason('');
    setBlockError('');
    setShowBlockModal(true);
    setActionMenuUser(null);
  };

  const handleReactivateUser = (user) => {
    setConfirmAction({
      type: 'reactivate',
      user,
      message: `Reactivate ${user.contactName}? They will be able to log in again.`
    });
    setActionMenuUser(null);
  };

  const handleDeleteUser = (user) => {
    setConfirmAction({
      type: 'delete',
      user,
      message: `Permanently delete ${user.contactName}? This action cannot be undone. The user will be permanently removed but their orders will be preserved.`
    });
    setActionMenuUser(null);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, user } = confirmAction;

    try {
      if (type === 'archive') {
        await adminAPI.updateUserStatus(user.id, { status: 'archived' });
      } else if (type === 'reactivate') {
        await adminAPI.updateUserStatus(user.id, { status: 'active' });
      } else if (type === 'delete') {
        await adminAPI.deleteUser(user.id);
      }
      setConfirmAction(null);
      loadUsers();
    } catch (error) {
      console.error(`Failed to ${type} user:`, error);
      alert(error.response?.data?.error || `Failed to ${type} user`);
    }
  };

  const executeBlockUser = async () => {
    if (!blockTarget) return;
    if (!blockReason || blockReason.trim().length < 10) {
      setBlockError('Block reason must be at least 10 characters');
      return;
    }

    try {
      await adminAPI.updateUserStatus(blockTarget.id, { status: 'blocked', blockReason: blockReason.trim() });
      setShowBlockModal(false);
      setBlockTarget(null);
      setBlockReason('');
      loadUsers();
    } catch (error) {
      console.error('Failed to block user:', error);
      setBlockError(error.response?.data?.error || 'Failed to block user');
    }
  };

  const handleOpenEditModal = (user) => {
    setEditUser({
      id: user.id,
      email: user.email,
      contactName: user.contactName,
      userType: user.userType,
      school_id: user.school_id || '',
      schoolName: user.schoolName || '',
      principalName: user.principalName || '',
      supervisor: user.supervisor || '',
      positionTitle: user.positionTitle || '',
      department: user.department || '',
      office_id: user.office_id || '',
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

    const isConversion = !!pendingTypeChange;

    // Validation for conversion mode
    if (isConversion) {
      if (!editUser.email) {
        setEditError('A valid email address is required');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editUser.email)) {
        setEditError('Please enter a valid email address');
        return;
      }
      if (editUser.userType === 'school_staff' && !editUser.school_id) {
        setEditError('A school must be assigned for School Staff Members');
        return;
      }
      if (editUser.userType === 'academica_employee' && !editUser.office_id) {
        setEditError('An office must be assigned for Academica Employees');
        return;
      }
      if (!editPassword || editPassword.length < 6) {
        setEditError('Password is required (min 6 characters)');
        return;
      }
      if (editPassword !== editConfirmPassword) {
        setEditError('Passwords do not match');
        return;
      }
    } else {
      // Validate password if provided
      if (editPassword) {
        if (editPassword !== editConfirmPassword) {
          setEditError('Passwords do not match');
          return;
        }
        if (editPassword.length < 6) {
          setEditError('Password must be at least 6 characters');
          return;
        }
      }
    }

    setEditingUser(true);

    try {
      if (isConversion) {
        // Guest conversion — single atomic API call
        await adminAPI.updateUserType(pendingTypeChange.userId, pendingTypeChange.toType, {
          email: editUser.email,
          contactName: editUser.contactName,
          password: editPassword || undefined,
          school_id: editUser.school_id || undefined,
          schoolName: editUser.schoolName || undefined,
          principalName: editUser.principalName || undefined,
          supervisor: editUser.supervisor || undefined,
          positionTitle: editUser.positionTitle || undefined,
          department: editUser.department || undefined,
          office_id: editUser.office_id || undefined,
          phone: editUser.phone || undefined,
        });

        setPendingTypeChange(null);
      } else {
        // Standard edit — existing flow
        await adminAPI.updateUser(editUser.id, {
          email: editUser.email,
          contactName: editUser.contactName,
          school_id: editUser.school_id,
          schoolName: editUser.schoolName,
          principalName: editUser.principalName,
          supervisor: editUser.supervisor,
          positionTitle: editUser.positionTitle,
          department: editUser.department,
          office_id: editUser.office_id,
          phone: editUser.phone,
        });

        // Update password if provided
        if (editPassword) {
          await adminAPI.updateUserPassword(editUser.id, editPassword);
        }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/admin" className="text-gray-500 hover:text-academica-blue text-sm mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-charcoal">Manage Users, Schools & Offices</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-academica-blue text-academica-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users
            </div>
          </button>
          <button
            onClick={() => setActiveTab('schools')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schools'
                ? 'border-academica-blue text-academica-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Schools
            </div>
          </button>
          <button
            onClick={() => setActiveTab('offices')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'offices'
                ? 'border-academica-blue text-academica-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Offices
            </div>
          </button>
        </nav>
      </div>

      {/* Schools Tab Content */}
      {activeTab === 'schools' && <SchoolsTab />}

      {/* Offices Tab Content */}
      {activeTab === 'offices' && <OfficesTab />}

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
        <>
          {/* Guest User Alert Banner */}
          {guestUserCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  {guestUserCount} Quick Added user{guestUserCount !== 1 ? 's' : ''} need{guestUserCount === 1 ? 's' : ''} profile completion
                </p>
                <p className="text-sm text-orange-700 mt-0.5">
                  These users were created during order placement with minimal information. Change their user type to assign them a complete profile.
                </p>
              </div>
            </div>
          )}

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {['active', 'archived', 'blocked', ...(isSuperAdmin ? ['all'] : [])].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-academica-blue text-white border-academica-blue'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {s === 'all' ? 'All' : USER_STATUS_BADGES[s]?.label || s}
                <span className="ml-1 text-xs opacity-75">
                  ({s === 'all' ? users.length : users.filter(u => u.status === s).length})
                </span>
              </button>
            ))}
          </div>

          {/* Users Tab Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-600">
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
                        {user.status && user.status !== 'active' && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${USER_STATUS_BADGES[user.status]?.className || ''}`}>
                            {user.status === 'blocked' && (
                              <svg className="w-3 h-3 inline mr-0.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            )}
                            {user.status === 'archived' && (
                              <svg className="w-3 h-3 inline mr-0.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                              </svg>
                            )}
                            {USER_STATUS_BADGES[user.status]?.label || user.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email || ''}</p>
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
                        {user.supervisor && (
                          <p><span className="font-medium">Supervisor:</span> {user.supervisor}</p>
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
                        <option value="guest">Quick Added</option>
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
                      {formatDateOnlyPT(user.createdAt)}
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

                  {/* Status Action Menu */}
                  {canEditUser(user) && user.id !== currentUser?.id && (
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuUser(actionMenuUser === user.id ? null : user.id)}
                        className="px-2 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        title="More actions"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {actionMenuUser === user.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActionMenuUser(null)} />
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            {(user.status === 'active') && (
                              <>
                                <button
                                  onClick={() => handleArchiveUser(user)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                                  </svg>
                                  Archive
                                </button>
                                <button
                                  onClick={() => handleBlockUser(user)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Block
                                </button>
                              </>
                            )}
                            {(user.status === 'archived' || user.status === 'blocked') && (
                              <button
                                onClick={() => handleReactivateUser(user)}
                                className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Reactivate
                              </button>
                            )}
                            {isSuperAdmin && user.userType !== 'superadmin' && (
                              <>
                                <div className="border-t border-gray-100 my-1" />
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete Permanently
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
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
                              {formatDatePT(order.createdAt, { month: 'long' })}
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
        </>
        )
      )}

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
                  <option value="guest">Quick Added</option>
                  <option value="school_staff">School Staff Member</option>
                  <option value="academica_employee">Academica Employee</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                  {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                </select>
              </div>

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
                {newUser.userType !== 'guest' && (
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

              {newUser.userType === 'school_staff' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
                    <SchoolDropdown
                      value={newUser.school_id}
                      onChange={(schoolId) => setNewUser({ ...newUser, school_id: schoolId })}
                      onSchoolNameChange={(schoolName) => setNewUser(prev => ({ ...prev, schoolName }))}
                      onPrincipalChange={(principalName) => setNewUser(prev => ({ ...prev, principalName }))}
                    />
                  </div>
                  {newUser.principalName && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <span className="font-medium text-gray-700">Principal: </span>
                      <span className="text-gray-600">{newUser.principalName}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor's Name</label>
                    <input
                      type="text"
                      value={newUser.supervisor}
                      onChange={(e) => setNewUser({ ...newUser, supervisor: e.target.value })}
                      className="input w-full"
                      placeholder="User's direct supervisor"
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
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office *</label>
                    <OfficeDropdown
                      value={newUser.office_id}
                      onChange={(officeId) => setNewUser({ ...newUser, office_id: officeId })}
                    />
                  </div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position/Title</label>
                    <input
                      type="text"
                      value={newUser.positionTitle}
                      onChange={(e) => setNewUser({ ...newUser, positionTitle: e.target.value })}
                      className="input w-full"
                      placeholder="Marketing Manager"
                    />
                  </div>
                </>
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
              <h2 className="text-xl font-semibold text-charcoal">{pendingTypeChange ? 'Convert User Profile' : 'Edit User Profile'}</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditUser(null); setPendingTypeChange(null); }}
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

              {/* Conversion info banner */}
              {pendingTypeChange ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-orange-800">
                    Converting user type: Complete this user's profile to change them from{' '}
                    <span className="line-through font-medium">{USER_TYPE_LABELS[pendingTypeChange.fromType] || pendingTypeChange.fromType}</span>
                    {' → '}
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-xs border ${USER_TYPE_COLORS[pendingTypeChange.toType] || ''}`}>
                      {USER_TYPE_LABELS[pendingTypeChange.toType] || pendingTypeChange.toType}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${USER_TYPE_COLORS[editUser.userType] || USER_TYPE_COLORS.school_staff}`}>
                    {USER_TYPE_LABELS[editUser.userType] || 'School Staff Member'}
                  </span>
                </div>
              )}

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

              {editUser.userType === 'school_staff' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
                    <SchoolDropdown
                      value={editUser.school_id}
                      onChange={(schoolId) => setEditUser({ ...editUser, school_id: schoolId })}
                      onSchoolNameChange={(schoolName) => setEditUser(prev => ({ ...prev, schoolName }))}
                      onPrincipalChange={(principalName) => setEditUser(prev => ({ ...prev, principalName }))}
                    />
                  </div>
                  {editUser.principalName && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <span className="font-medium text-gray-700">Principal: </span>
                      <span className="text-gray-600">{editUser.principalName}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor's Name</label>
                    <input
                      type="text"
                      value={editUser.supervisor}
                      onChange={(e) => setEditUser({ ...editUser, supervisor: e.target.value })}
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
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office *</label>
                    <OfficeDropdown
                      value={editUser.office_id}
                      onChange={(officeId) => setEditUser({ ...editUser, office_id: officeId })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={editUser.department}
                      onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editUser.phone}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  className="input w-full"
                />
              </div>

              {/* Password Section (visible to superadmins for all user types) */}
              {isSuperAdmin && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {pendingTypeChange ? 'Set Password *' : 'Change Password'}
                  </p>
                  {!pendingTypeChange && (
                    <p className="text-xs text-gray-500 mb-3">Leave blank to keep current password</p>
                  )}
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
                  onClick={() => { setShowEditModal(false); setEditUser(null); setPendingTypeChange(null); }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingUser}
                  className="btn btn-primary"
                >
                  {editingUser
                    ? 'Saving...'
                    : pendingTypeChange
                      ? `Save & Convert to ${USER_TYPE_LABELS[pendingTypeChange.toType] || pendingTypeChange.toType}`
                      : 'Save Changes'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && blockTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal">Block User</h2>
              <button
                onClick={() => { setShowBlockModal(false); setBlockTarget(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Blocking <span className="font-semibold">{blockTarget.contactName}</span> will prevent them from logging in. The reason you provide will be displayed to the user when they attempt to sign in.
              </p>

              {blockError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {blockError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for blocking (shown to user at login) *
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => { setBlockReason(e.target.value); setBlockError(''); }}
                  rows={3}
                  className="input w-full"
                  placeholder="Explain why this account is being blocked (minimum 10 characters)..."
                />
                <p className="text-xs text-gray-400 mt-1">{blockReason.length}/10 minimum characters</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowBlockModal(false); setBlockTarget(null); }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeBlockUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                >
                  Block User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                {confirmAction.type === 'delete' ? (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                ) : confirmAction.type === 'archive' ? (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-charcoal">
                    {confirmAction.type === 'delete' ? 'Delete User' : confirmAction.type === 'archive' ? 'Archive User' : 'Reactivate User'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{confirmAction.message}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmAction}
                  className={`px-4 py-2 rounded-lg font-medium text-sm text-white ${
                    confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                    confirmAction.type === 'archive' ? 'bg-gray-600 hover:bg-gray-700' :
                    'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {confirmAction.type === 'delete' ? 'Delete Permanently' : confirmAction.type === 'archive' ? 'Archive' : 'Reactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
