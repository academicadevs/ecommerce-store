import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, adminAPI } from '../services/api';
import UserDropdown from '../components/UserDropdown';

const projectTypes = [
  { value: 'custom-design', label: 'Custom Design Project', description: 'Need something designed from scratch' },
  { value: 'modification', label: 'Modify Existing Materials', description: 'Update or revise existing designs' },
  { value: 'rush-order', label: 'Rush/Urgent Request', description: 'Time-sensitive project with tight deadline' },
  { value: 'bulk-order', label: 'Large Bulk Order', description: 'High-volume order requiring special coordination' },
  { value: 'event-materials', label: 'Event Materials Package', description: 'Comprehensive materials for an upcoming event' },
  { value: 'branding', label: 'Branding/Identity Project', description: 'School branding, logos, or identity work' },
  { value: 'other', label: 'Other', description: 'Something not listed above' },
];

const materialTypes = [
  'Print Materials (Flyers, Brochures, etc.)',
  'Signage & Banners',
  'Apparel & Promotional Items',
  'Digital Graphics',
  'Trade Show Materials',
  'Booklets & Guides',
  'Multiple/Various',
  'Not Sure - Need Guidance',
];

const timelineOptions = [
  { value: 'urgent', label: 'Urgent (Within 1 week)', warning: true },
  { value: 'soon', label: '2-3 weeks' },
  { value: 'standard', label: '4-6 weeks' },
  { value: 'flexible', label: 'Flexible / No Rush' },
];

export default function CustomRequest() {
  const { isAuthenticated, isAdmin, isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();
  const isAdminUser = isAdmin || isSuperAdmin;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Admin on-behalf-of state
  const [adminOrderMode, setAdminOrderMode] = useState('self');
  const [orderingAs, setOrderingAs] = useState('school_staff');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [onBehalfInfo, setOnBehalfInfo] = useState({ contactName: '', email: '', phone: '', schoolName: '' });

  // Get the effective user based on admin mode
  const effectiveUser = isAdminUser && adminOrderMode === 'existing' && selectedUserInfo
    ? selectedUserInfo
    : isAdminUser && adminOrderMode === 'new'
      ? { contactName: onBehalfInfo.contactName, email: onBehalfInfo.email, phone: onBehalfInfo.phone, schoolName: onBehalfInfo.schoolName }
      : user;

  const [formData, setFormData] = useState({
    // Project Details
    projectType: '',
    projectTitle: '',
    materialTypes: [],
    timeline: '',
    eventDate: '',

    // Description
    projectDescription: '',
    objectives: '',
    targetAudience: '',
    keyMessages: '',

    // Specifications
    quantity: '',
    sizeRequirements: '',
    colorPreferences: '',
    existingBranding: '',

    // Files & References
    hasExistingFiles: false,
    fileDescription: '',
    referenceLinks: '',
    inspirationNotes: '',

    // Additional
    budgetRange: '',
    additionalNotes: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleMaterialTypeChange = (material) => {
    setFormData(prev => ({
      ...prev,
      materialTypes: prev.materialTypes.includes(material)
        ? prev.materialTypes.filter(m => m !== material)
        : [...prev.materialTypes, material]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build structured request data for display in order items
      const requestDetails = {
        requestType: 'custom',
        projectType: projectTypes.find(p => p.value === formData.projectType)?.label || formData.projectType,
        projectTitle: formData.projectTitle,
        timeline: timelineOptions.find(t => t.value === formData.timeline)?.label || formData.timeline,
        eventDate: formData.eventDate || null,
        materialTypes: formData.materialTypes,
        projectDescription: formData.projectDescription,
        objectives: formData.objectives || null,
        targetAudience: formData.targetAudience || null,
        keyMessages: formData.keyMessages || null,
        specifications: {
          quantity: formData.quantity || null,
          sizeRequirements: formData.sizeRequirements || null,
          colorPreferences: formData.colorPreferences || null,
          existingBranding: formData.existingBranding || null,
        },
        files: {
          hasExistingFiles: formData.hasExistingFiles,
          fileDescription: formData.fileDescription || null,
          referenceLinks: formData.referenceLinks || null,
          inspirationNotes: formData.inspirationNotes || null,
        },
        budgetRange: formData.budgetRange || null,
        additionalNotes: formData.additionalNotes || null,
      };

      // Determine shipping info and onBehalfOfUserId based on admin mode
      let submitShippingInfo;
      let onBehalfOfUserId = null;

      if (isAdminUser && adminOrderMode === 'existing' && selectedUserId) {
        onBehalfOfUserId = selectedUserId;
        submitShippingInfo = {
          schoolName: selectedUserInfo?.schoolName || '',
          contactName: selectedUserInfo?.contactName || '',
          positionTitle: selectedUserInfo?.positionTitle || 'Custom Request',
          principalName: selectedUserInfo?.principalName || 'N/A',
          email: selectedUserInfo?.email || '',
          phone: selectedUserInfo?.phone || '',
        };
      } else if (isAdminUser && adminOrderMode === 'new') {
        if (!onBehalfInfo.contactName.trim()) {
          setError('Name is required when creating a new person');
          setLoading(false);
          return;
        }
        const createRes = await adminAPI.createQuickUser(onBehalfInfo);
        onBehalfOfUserId = createRes.data.user.id;
        submitShippingInfo = {
          schoolName: onBehalfInfo.schoolName || '',
          contactName: onBehalfInfo.contactName,
          email: onBehalfInfo.email || '',
          phone: onBehalfInfo.phone || '',
        };
      } else {
        submitShippingInfo = {
          schoolName: user?.schoolName || '',
          contactName: user?.contactName || '',
          positionTitle: user?.positionTitle || 'Custom Request',
          principalName: user?.principalName || 'N/A',
          email: user?.email || '',
          phone: user?.phone || '',
        };
      }

      // Create order with custom request data
      await ordersAPI.create({
        shippingInfo: submitShippingInfo,
        onBehalfOfUserId,
        notes: formData.additionalNotes || null,
        isCustomRequest: true,
        customRequestData: requestDetails,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <svg className="w-16 h-16 text-academica-blue mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold text-charcoal mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to submit a custom request.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn btn-primary px-8 py-3">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-secondary px-8 py-3">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-4">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your custom request. Our Design Department will review your submission
            and reach out to discuss your project details.
          </p>
          <p className="text-sm text-gray-500">Redirecting to your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Custom Request</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Need something special? Fill out this form to submit a custom project request
            to the Academica Design Department.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Admin: Order Options */}
          {isAdminUser ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
              <div className="text-lg font-semibold text-blue-800">Admin Order Options</div>

              {/* 3-mode radio group */}
              <div className="flex flex-col gap-2">
                {[
                  { value: 'self', label: 'Submit under my account', desc: 'Order linked to your account' },
                  { value: 'existing', label: 'Submit for existing user', desc: 'Search and select a user' },
                  { value: 'new', label: 'Submit for new person', desc: 'Create a new user on the fly' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                      adminOrderMode === opt.value
                        ? 'border-academica-blue bg-white'
                        : 'border-transparent hover:bg-blue-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adminOrderMode"
                      value={opt.value}
                      checked={adminOrderMode === opt.value}
                      onChange={() => {
                        setAdminOrderMode(opt.value);
                        setOrderingAs('school_staff');
                        setSelectedUserId(null);
                        setSelectedUserInfo(null);
                        setOnBehalfInfo({ contactName: '', email: '', phone: '', schoolName: '' });
                      }}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-charcoal text-sm">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* User type toggle (for existing/new modes) */}
              {adminOrderMode !== 'self' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                  <select
                    value={orderingAs}
                    onChange={(e) => {
                      setOrderingAs(e.target.value);
                      setSelectedUserId(null);
                      setSelectedUserInfo(null);
                    }}
                    className="input"
                  >
                    <option value="school_staff">School Staff Member</option>
                    <option value="academica_employee">Academica Employee (Internal)</option>
                  </select>
                </div>
              )}

              {/* Self mode - show current user summary */}
              {adminOrderMode === 'self' && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-academica-blue-50 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">{user?.contactName}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      {user?.schoolName && user.schoolName !== 'N/A' && (
                        <p className="text-sm text-gray-500">{user.schoolName}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Existing user search */}
              {adminOrderMode === 'existing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search & Select User
                  </label>
                  <UserDropdown
                    value={selectedUserId}
                    onChange={(userId, userObj) => {
                      setSelectedUserId(userId);
                      setSelectedUserInfo(userObj);
                    }}
                    onClear={() => {
                      setSelectedUserId(null);
                      setSelectedUserInfo(null);
                    }}
                    onCreateNew={() => {
                      setAdminOrderMode('new');
                      setSelectedUserId(null);
                      setSelectedUserInfo(null);
                    }}
                    userTypeFilter={orderingAs}
                  />
                  {selectedUserInfo && (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Selected: {selectedUserInfo.contactName} ({selectedUserInfo.email})
                    </div>
                  )}
                </div>
              )}

              {/* New person quick-create fields */}
              {adminOrderMode === 'new' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={onBehalfInfo.contactName}
                      onChange={(e) => setOnBehalfInfo(prev => ({ ...prev, contactName: e.target.value }))}
                      className="input"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={onBehalfInfo.email}
                      onChange={(e) => setOnBehalfInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={onBehalfInfo.phone}
                      onChange={(e) => setOnBehalfInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="input"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School (optional)</label>
                    <input
                      type="text"
                      value={onBehalfInfo.schoolName}
                      onChange={(e) => setOnBehalfInfo(prev => ({ ...prev, schoolName: e.target.value }))}
                      className="input"
                      placeholder="School name"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Show user info for non-admins */
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Submitting As
              </h2>
              <div className="text-sm">
                <p className="font-medium text-charcoal">{user?.contactName}</p>
                <p className="text-gray-600">{user?.schoolName}</p>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>
          )}

          {/* Project Type */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Project Type
            </h2>
            <div className="space-y-3">
              {projectTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.projectType === type.value
                      ? 'border-academica-blue bg-academica-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="projectType"
                    value={type.value}
                    checked={formData.projectType === type.value}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                  <div>
                    <span className="font-medium text-charcoal">{type.label}</span>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
              <input
                type="text"
                name="projectTitle"
                value={formData.projectTitle}
                onChange={handleChange}
                required
                className="input"
                placeholder="e.g., Spring Open House Materials, New Campus Signage"
              />
            </div>
          </div>

          {/* Materials Needed */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Materials Needed
            </h2>
            <p className="text-sm text-gray-500 mb-4">Select all that apply:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {materialTypes.map((material) => (
                <label
                  key={material}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.materialTypes.includes(material)
                      ? 'border-academica-blue bg-academica-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.materialTypes.includes(material)}
                    onChange={() => handleMaterialTypeChange(material)}
                    className="rounded"
                  />
                  <span className="text-sm text-charcoal">{material}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Timeline
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">When do you need this? *</label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Select timeline...</option>
                  {timelineOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formData.timeline === 'urgent' && (
                  <p className="text-sm text-amber-600 mt-1">
                    Rush requests may require additional coordination.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event/Due Date (if applicable)</label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Project Description */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Project Description
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe your project in detail *
                </label>
                <textarea
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="input"
                  placeholder="Please provide as much detail as possible about what you need..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What are the main objectives/goals?
                </label>
                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleChange}
                  rows={2}
                  className="input"
                  placeholder="e.g., Increase enrollment, promote upcoming event, build brand awareness..."
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Prospective families, current students, community"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Messages</label>
                  <input
                    type="text"
                    name="keyMessages"
                    value={formData.keyMessages}
                    onChange={handleChange}
                    className="input"
                    placeholder="Main points you want to communicate"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Specifications
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Quantity</label>
                <input
                  type="text"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., 500 flyers, 2 banners, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size Requirements</label>
                <input
                  type="text"
                  name="sizeRequirements"
                  value={formData.sizeRequirements}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., 8.5x11, 24x36, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color Preferences</label>
                <input
                  type="text"
                  name="colorPreferences"
                  value={formData.colorPreferences}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., School colors, specific Pantone colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Existing Branding to Use</label>
                <input
                  type="text"
                  name="existingBranding"
                  value={formData.existingBranding}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Logo, tagline, brand guidelines"
                />
              </div>
            </div>
          </div>

          {/* Files & References */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Files & References
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="hasExistingFiles"
                  checked={formData.hasExistingFiles}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm text-charcoal">I have existing files, logos, or images to provide</span>
              </label>

              {formData.hasExistingFiles && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Describe the files you'll provide
                  </label>
                  <textarea
                    name="fileDescription"
                    value={formData.fileDescription}
                    onChange={handleChange}
                    rows={2}
                    className="input"
                    placeholder="e.g., School logo (AI file), photos from last event, previous flyer design..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You'll be able to send files via email after submitting this request.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Links (optional)
                </label>
                <textarea
                  name="referenceLinks"
                  value={formData.referenceLinks}
                  onChange={handleChange}
                  rows={2}
                  className="input"
                  placeholder="Links to examples, inspiration, or reference materials..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspiration Notes
                </label>
                <textarea
                  name="inspirationNotes"
                  value={formData.inspirationNotes}
                  onChange={handleChange}
                  rows={2}
                  className="input"
                  placeholder="Describe the look and feel you're going for..."
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Additional Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range (optional)</label>
                <select
                  name="budgetRange"
                  value={formData.budgetRange}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Prefer not to say</option>
                  <option value="under-500">Under $500</option>
                  <option value="500-1000">$500 - $1,000</option>
                  <option value="1000-2500">$1,000 - $2,500</option>
                  <option value="2500-5000">$2,500 - $5,000</option>
                  <option value="over-5000">Over $5,000</option>
                  <option value="tbd">To Be Determined</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anything else we should know?
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={3}
                  className="input"
                  placeholder="Any other details, questions, or special considerations..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <p className="text-sm text-gray-500">
                Our Design Department will review your request and follow up within 1-2 business days.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary px-8 py-3 whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Custom Request'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
