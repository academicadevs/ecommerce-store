import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';

export default function Checkout() {
  const { items } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.userType === 'admin' || user?.userType === 'superadmin' || user?.role === 'admin';
  const baseUserType = user?.userType || 'school_staff';

  // Admin can switch between ordering as school staff or academica employee
  // Default to school_staff for admins since that's most common
  const [orderingAs, setOrderingAs] = useState(isAdmin ? 'school_staff' : baseUserType);
  const isAcademicaEmployee = isAdmin ? orderingAs === 'academica_employee' : baseUserType === 'academica_employee';

  const [formData, setFormData] = useState({
    schoolName: user?.schoolName || '',
    contactName: user?.contactName || '',
    positionTitle: user?.positionTitle || '',
    department: user?.department || '',
    principalName: user?.principalName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    notes: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await ordersAPI.create({
        shippingInfo: {
          schoolName: formData.schoolName,
          contactName: formData.contactName,
          positionTitle: isAcademicaEmployee ? formData.department : formData.positionTitle,
          principalName: formData.principalName,
          email: formData.email,
          phone: formData.phone,
          orderedBy: isAcademicaEmployee ? 'academica_employee' : 'school_staff',
          department: isAcademicaEmployee ? formData.department : null,
          isAdminOrder: isAdmin,
        },
        notes: formData.notes,
      });

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
          {/* School Information Form */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-charcoal mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {isAcademicaEmployee ? 'Order Information' : 'School Information'}
              </h2>

              {/* Admin Role Selector */}
              {isAdmin && (
                <div className="mb-6">
                  <label htmlFor="orderingAs" className="block text-sm font-medium text-gray-700 mb-2">
                    Ordering on behalf of:
                  </label>
                  <select
                    id="orderingAs"
                    value={orderingAs}
                    onChange={(e) => setOrderingAs(e.target.value)}
                    className="input"
                  >
                    <option value="school_staff">School Staff Member</option>
                    <option value="academica_employee">Academica Employee</option>
                  </select>
                </div>
              )}

              {isAcademicaEmployee && !isAdmin && (
                <div className="bg-academica-blue-50 rounded-lg p-3 mb-4 text-sm text-academica-blue">
                  Ordering as Academica Employee ({user?.department || 'Corporate'})
                </div>
              )}

              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
                {/* School to order for (required for all) */}
                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                    {isAcademicaEmployee ? 'School Ordering For *' : 'School Name *'}
                  </label>
                  <input
                    type="text"
                    id="schoolName"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder={isAcademicaEmployee ? 'Enter school name this order is for' : 'Academica Charter School'}
                  />
                </div>

                {/* Principal's Name (required for all orders) */}
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
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
                    <label htmlFor="positionTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      {isAcademicaEmployee ? 'Department *' : 'Your Position/Title *'}
                    </label>
                    <input
                      type="text"
                      id={isAcademicaEmployee ? 'department' : 'positionTitle'}
                      name={isAcademicaEmployee ? 'department' : 'positionTitle'}
                      value={isAcademicaEmployee ? formData.department : formData.positionTitle}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder={isAcademicaEmployee ? 'Marketing' : 'Marketing Coordinator'}
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
                    placeholder="Any special requests or notes for your order..."
                  />
                </div>

                </form>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-charcoal mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-charcoal">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      {item.selectedOptions && (
                        <div className="text-xs text-gray-400 mt-1">
                          {Object.entries(item.selectedOptions).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="mr-2">{value}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''} in your order</p>
              </div>

              <div className="bg-academica-blue-50 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-academica-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-charcoal">No payment required now</p>
                    <p className="text-gray-600 mt-1">
                      Your order request will be reviewed and you'll receive a quote with shipping costs. Payment will be collected after approval.
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
                    Submitting Order...
                  </span>
                ) : (
                  'Submit Order Request'
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
