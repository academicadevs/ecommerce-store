import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, adminAPI } from '../services/api';

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.userType === 'superadmin' || user?.role === 'admin';
  const dropdownRef = useRef(null);

  // For admins ordering on behalf of others
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [orderingAs, setOrderingAs] = useState('school_staff'); // 'school_staff' or 'academica_employee'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Determine if current order is for Academica employee
  const isAcademicaEmployee = isAdmin
    ? orderingAs === 'academica_employee'
    : user?.userType === 'academica_employee';

  const [formData, setFormData] = useState({
    schoolName: '',
    contactName: '',
    positionTitle: '',
    department: '',
    principalName: '',
    email: '',
    phone: '',
    additionalEmails: '',
    notes: '',
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load users list for admin
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      // Non-admin users: populate with their own info
      setFormData({
        schoolName: user?.schoolName || '',
        contactName: user?.contactName || '',
        positionTitle: user?.positionTitle || '',
        department: user?.department || '',
        principalName: user?.principalName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        additionalEmails: '',
        notes: '',
      });
    }
  }, [isAdmin, user]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await adminAPI.getUsers();
      // Filter out admin users - only show regular users
      const regularUsers = response.data.users.filter(u =>
        u.role !== 'admin' && u.userType !== 'superadmin'
      );
      setUsers(regularUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users by type and search term
  const filteredUsers = users.filter(u => {
    // First filter by type
    const typeMatch = orderingAs === 'academica_employee'
      ? u.userType === 'academica_employee'
      : u.userType === 'school_staff' || !u.userType;

    if (!typeMatch) return false;

    // Then filter by search term
    if (!userSearch.trim()) return true;

    const search = userSearch.toLowerCase();
    return (
      u.contactName?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.schoolName?.toLowerCase().includes(search) ||
      u.department?.toLowerCase().includes(search)
    );
  });

  // Handle user type change
  const handleOrderingAsChange = (value) => {
    setOrderingAs(value);
    setSelectedUserId('');
    setUserSearch('');
    setShowUserDropdown(false);
    // Clear form when switching types
    setFormData({
      schoolName: '',
      contactName: '',
      positionTitle: '',
      department: '',
      principalName: '',
      email: '',
      phone: '',
      additionalEmails: '',
      notes: formData.notes, // Keep notes
    });
  };

  // Handle user selection - auto-populate form
  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    setShowUserDropdown(false);

    if (!userId) {
      setUserSearch('');
      // Clear form if no user selected
      setFormData({
        schoolName: '',
        contactName: '',
        positionTitle: '',
        department: '',
        principalName: '',
        email: '',
        phone: '',
        additionalEmails: '',
        notes: formData.notes,
      });
      return;
    }

    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      // Update search field to show selected user
      setUserSearch(selectedUser.contactName + (selectedUser.schoolName ? ` - ${selectedUser.schoolName}` : selectedUser.department ? ` - ${selectedUser.department}` : ''));
      setFormData({
        schoolName: selectedUser.schoolName || '',
        contactName: selectedUser.contactName || '',
        positionTitle: selectedUser.positionTitle || '',
        department: selectedUser.department || '',
        principalName: selectedUser.principalName || '',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        additionalEmails: '',
        notes: formData.notes,
      });
    }
  };

  // Clear selected user when search changes
  const handleSearchChange = (value) => {
    setUserSearch(value);
    setShowUserDropdown(true);
    if (selectedUserId) {
      setSelectedUserId('');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Parse additional emails (comma-separated, trimmed)
      const additionalEmails = formData.additionalEmails
        ? formData.additionalEmails.split(',').map(e => e.trim()).filter(e => e)
        : [];

      // Build shipping info based on user type
      const shippingInfo = isAcademicaEmployee
        ? {
            // Academica employee - internal use, no school
            contactName: formData.contactName,
            department: formData.department,
            email: formData.email,
            phone: formData.phone,
            additionalEmails,
            orderedBy: 'academica_employee',
            isInternalOrder: true,
          }
        : {
            // School staff - full school info
            schoolName: formData.schoolName,
            contactName: formData.contactName,
            positionTitle: formData.positionTitle,
            principalName: formData.principalName,
            email: formData.email,
            phone: formData.phone,
            additionalEmails,
            orderedBy: 'school_staff',
          };

      // If admin placed order on behalf of someone, track which user
      if (isAdmin && selectedUserId) {
        shippingInfo.orderedForUserId = selectedUserId;
      }

      const response = await ordersAPI.create({
        shippingInfo,
        notes: formData.notes,
      });

      await clearCart();
      navigate(`/order-confirmation/${response.data.order.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-charcoal mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Add some products before checking out.</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-academica-blue transition-colors">Home</Link>
          <span className="text-gray-400">/</span>
          <Link to="/cart" className="hover:text-academica-blue transition-colors">Cart</Link>
          <span className="text-gray-400">/</span>
          <span className="text-charcoal font-medium">Checkout</span>
        </nav>

        <h1 className="text-3xl font-bold text-charcoal mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Order Information Form */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-charcoal mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {isAcademicaEmployee ? 'Academica Employee Order' : 'School Information'}
              </h2>

              {/* Admin: Order on behalf of selection */}
              {isAdmin && (
                <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800 mb-2">
                    Submitting request on behalf of:
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Type
                    </label>
                    <select
                      value={orderingAs}
                      onChange={(e) => handleOrderingAsChange(e.target.value)}
                      className="input"
                    >
                      <option value="school_staff">School Staff Member</option>
                      <option value="academica_employee">Academica Employee (Internal)</option>
                    </select>
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search & Select User
                    </label>
                    {loadingUsers ? (
                      <div className="text-sm text-gray-500">Loading users...</div>
                    ) : (
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onFocus={() => setShowUserDropdown(true)}
                            placeholder="Search by name, email, school, or department..."
                            className="input pr-8"
                          />
                          {userSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setUserSearch('');
                                setSelectedUserId('');
                                setShowUserDropdown(false);
                                setFormData({
                                  schoolName: '',
                                  contactName: '',
                                  positionTitle: '',
                                  department: '',
                                  principalName: '',
                                  email: '',
                                  phone: '',
                                  additionalEmails: '',
                                  notes: formData.notes,
                                });
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {showUserDropdown && !selectedUserId && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map(u => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => handleUserSelect(u.id)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                >
                                  <div className="font-medium text-charcoal text-sm">{u.contactName}</div>
                                  <div className="text-xs text-gray-500">
                                    {u.email}
                                    {u.schoolName && ` • ${u.schoolName}`}
                                    {u.department && ` • ${u.department}`}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                {userSearch ? 'No users found matching your search' : 'No users available. Enter details manually below.'}
                              </div>
                            )}
                            {filteredUsers.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowUserDropdown(false);
                                  setSelectedUserId('');
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-academica-blue hover:bg-blue-50 border-t border-gray-200"
                              >
                                Or enter details manually below
                              </button>
                            )}
                          </div>
                        )}
                        {selectedUserId && (
                          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            User selected - form populated
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Non-admin Academica employee info banner */}
              {!isAdmin && isAcademicaEmployee && (
                <div className="bg-purple-50 rounded-lg p-3 mb-4 text-sm text-purple-800 border border-purple-200">
                  <strong>Internal Order</strong> - This order is for Academica internal use.
                  Our design team will help with your materials.
                </div>
              )}

              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
                {/* School fields - only for school staff */}
                {!isAcademicaEmployee && (
                  <>
                    <div>
                      <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                        School Name *
                      </label>
                      <input
                        type="text"
                        id="schoolName"
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleChange}
                        required
                        className="input"
                        placeholder="Academica Charter School"
                      />
                    </div>

                    <div>
                      <label htmlFor="principalName" className="block text-sm font-medium text-gray-700 mb-1">
                        Principal's Name *
                      </label>
                      <input
                        type="text"
                        id="principalName"
                        name="principalName"
                        value={formData.principalName}
                        onChange={handleChange}
                        required
                        className="input"
                        placeholder="Dr. Jane Smith"
                      />
                    </div>
                  </>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                      {isAcademicaEmployee ? 'Your Name *' : 'Contact Name *'}
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label htmlFor={isAcademicaEmployee ? 'department' : 'positionTitle'} className="block text-sm font-medium text-gray-700 mb-1">
                      {isAcademicaEmployee ? 'Department *' : 'Position/Title *'}
                    </label>
                    <input
                      type="text"
                      id={isAcademicaEmployee ? 'department' : 'positionTitle'}
                      name={isAcademicaEmployee ? 'department' : 'positionTitle'}
                      value={isAcademicaEmployee ? formData.department : formData.positionTitle}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder={isAcademicaEmployee ? 'Marketing, HR, Finance...' : 'Marketing Coordinator'}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="additionalEmails" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Email Recipients (Optional)
                  </label>
                  <input
                    type="text"
                    id="additionalEmails"
                    name="additionalEmails"
                    value={formData.additionalEmails}
                    onChange={handleChange}
                    className="input"
                    placeholder="colleague@school.edu, principal@school.edu"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Comma-separated emails to CC on all order correspondence
                  </p>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="input"
                    placeholder={isAcademicaEmployee
                      ? "Describe what you need (presentation materials, department event, etc.)..."
                      : "Any special requests or notes for your order..."}
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-charcoal mb-6">Request Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => {
                  const opts = item.selectedOptions || item.options || {};
                  return (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-charcoal">{item.name}</p>
                        {Object.keys(opts).length > 0 && (
                          <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                            {Object.entries(opts).map(([key, value]) => {
                              if (!value || key === 'customText' || key === 'artworkOption') return null;
                              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                              return <p key={key} className="text-xs">{label}: {value}</p>;
                            })}
                            {opts.artworkOption && (
                              <p className="text-xs">Artwork: {opts.artworkOption.replace(/-/g, ' ')}</p>
                            )}
                            {opts.customText && typeof opts.customText === 'object' && opts.customText.headline && (
                              <p className="text-xs">Headline: {opts.customText.headline}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''} in your request</p>
              </div>

              <div className="bg-academica-blue-50 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-academica-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-charcoal">No payment required now</p>
                    <p className="text-gray-600 mt-1">
                      {isAcademicaEmployee
                        ? "Our design team will review your request and reach out to discuss your needs."
                        : "Your request will be reviewed and you'll receive a quote. Payment will be collected after approval."}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-lg mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  isAcademicaEmployee ? 'Submit Request' : 'Submit Request'
                )}
              </button>

              <Link to="/cart" className="block text-center text-academica-blue hover:text-academica-blue-600 mt-4 font-medium">
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
