import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const USER_TYPES = [
  {
    id: 'school_staff',
    title: 'School Staff Member',
    description: 'I work at an Academica charter school',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'academica_employee',
    title: 'Academica Employee',
    description: 'I work at Academica corporate',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    userType: '',
    email: '',
    middleName: '',
    contactName: '',
    positionTitle: '',
    // School staff fields
    schoolName: '',
    principalName: '',
    // Academica employee fields
    department: '',
    // Common fields
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleUserTypeSelect = (type) => {
    setFormData({ ...formData, userType: type });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.middleName || formData.middleName.trim().length < 2) {
      setError('Middle name is required and must be at least 2 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        userType: formData.userType,
        email: formData.email,
        middleName: formData.middleName.trim(),
        contactName: formData.contactName,
        positionTitle: formData.positionTitle,
        schoolName: formData.schoolName,
        principalName: formData.principalName,
        department: formData.department,
        phone: formData.phone,
        address: formData.address,
      });
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">
            {step === 1 ? 'Select your account type' : 'Complete your registration'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Select User Type */}
          {step === 1 && (
            <div className="space-y-4">
              {USER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleUserTypeSelect(type.id)}
                  className="w-full flex items-center gap-4 p-4 border-2 rounded-lg hover:border-academica-blue hover:bg-academica-blue-50 transition-all text-left"
                >
                  <div className="text-academica-blue">{type.icon}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{type.title}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Registration Form */}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-academica-blue mb-6"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Change account type
              </button>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Contact Name */}
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
                    placeholder="John Doe"
                  />
                </div>

                {/* Position/Title */}
                <div>
                  <label htmlFor="positionTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Position/Title *
                  </label>
                  <input
                    type="text"
                    id="positionTitle"
                    name="positionTitle"
                    value={formData.positionTitle}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder={formData.userType === 'academica_employee' ? 'Marketing Manager' : 'Marketing Coordinator'}
                  />
                </div>

                {/* School Staff Fields */}
                {formData.userType === 'school_staff' && (
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

                {/* Academica Employee Fields */}
                {formData.userType === 'academica_employee' && (
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="Marketing, Operations, etc."
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder={formData.userType === 'academica_employee' ? 'you@academica.com' : 'you@school.org'}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.userType === 'school_staff' ? 'School Address' : 'Office Address'}
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                {/* Middle Name - Used as Password */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Your middle name is your password</p>
                      <p className="text-xs text-blue-600 mt-1">When signing in, use your middle name as your password. This helps keep things simple and secure.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name *
                  </label>
                  <input
                    type="text"
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="Your middle name (this will be your password)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Min 2 characters. Remember this - you'll use it to sign in.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary py-3"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-academica-blue hover:text-academica-blue-600 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
