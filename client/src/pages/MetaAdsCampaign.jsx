import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, adminAPI } from '../services/api';

const campaignObjectives = [
  { value: 'enrollment', label: 'Student Enrollment', description: 'Drive applications and enrollments for your school' },
  { value: 'open-house', label: 'Open House / Tour Promotion', description: 'Promote upcoming open house events and campus tours' },
  { value: 'brand-awareness', label: 'Brand Awareness', description: 'Increase visibility and recognition in your community' },
  { value: 'event-promotion', label: 'Event Promotion', description: 'Promote school events, fundraisers, or activities' },
  { value: 're-enrollment', label: 'Re-Enrollment Campaign', description: 'Encourage current families to re-enroll' },
  { value: 'staff-recruitment', label: 'Staff Recruitment', description: 'Attract teachers and staff to your school' },
  { value: 'other', label: 'Other', description: 'Custom campaign objective' },
];

const budgetRanges = [
  { value: '500-1000', label: '$500 - $1,000/month' },
  { value: '1000-2000', label: '$1,000 - $2,000/month' },
  { value: '2000-3500', label: '$2,000 - $3,500/month' },
  { value: '3500-5000', label: '$3,500 - $5,000/month' },
  { value: '5000-plus', label: '$5,000+/month' },
  { value: 'tbd', label: 'Need guidance on budget' },
];

const durationOptions = [
  { value: '2-weeks', label: '2 weeks' },
  { value: '1-month', label: '1 month' },
  { value: '2-months', label: '2 months' },
  { value: '3-months', label: '3 months' },
  { value: '6-months', label: '6 months' },
  { value: 'ongoing', label: 'Ongoing / Year-round' },
];

const targetAudienceOptions = [
  'Parents of preschool-age children (3-5)',
  'Parents of elementary-age children (5-10)',
  'Parents of middle school-age children (11-13)',
  'Parents of high school-age children (14-18)',
  'Young professionals / Recent graduates',
  'Community members',
  'Educators / Teachers',
];

export default function MetaAdsCampaign() {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Admin: select user on behalf of
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load users list for admins
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await adminAPI.getUsers();
      // Filter to only show non-admin users (school staff)
      const schoolUsers = response.data.users.filter(u =>
        u.userType === 'school_staff' || u.userType === 'academica_employee'
      );
      setUsers(schoolUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    if (userId) {
      const user = users.find(u => u.id === userId);
      setSelectedUser(user);
    } else {
      setSelectedUser(null);
    }
  };

  // Get the effective user (selected user for admin, or logged-in user)
  const effectiveUser = isAdmin && selectedUser ? selectedUser : user;

  const [formData, setFormData] = useState({
    // Campaign Details
    campaignObjective: '',
    otherObjective: '',
    campaignName: '',

    // Target Audience
    targetAudiences: [],
    geographicArea: '',
    radiusMiles: '10',
    additionalTargeting: '',

    // Budget & Timeline
    budget: '',
    duration: '',
    startDate: '',

    // Creative & Content
    hasCreativeAssets: '',
    creativeDescription: '',
    keyMessages: '',
    callToAction: '',

    // Landing Page
    hasLandingPage: '',
    landingPageUrl: '',
    needsLandingPage: false,

    // Meta/Facebook Info
    hasFacebookPage: '',
    facebookPageUrl: '',
    hasInstagramAccount: '',
    instagramHandle: '',
    hasMetaAdsAccount: '',

    // Additional
    previousAdExperience: '',
    competitorSchools: '',
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

  const handleAudienceChange = (audience) => {
    setFormData(prev => ({
      ...prev,
      targetAudiences: prev.targetAudiences.includes(audience)
        ? prev.targetAudiences.filter(a => a !== audience)
        : [...prev.targetAudiences, audience]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build structured request data for display in order items
      const requestDetails = {
        requestType: 'meta-ads',
        campaignObjective: campaignObjectives.find(o => o.value === formData.campaignObjective)?.label || formData.campaignObjective,
        otherObjective: formData.otherObjective || null,
        campaignName: formData.campaignName,
        targetAudience: {
          demographics: formData.targetAudiences,
          geographicArea: formData.geographicArea,
          radiusMiles: formData.radiusMiles,
          additionalTargeting: formData.additionalTargeting || null,
        },
        budgetTimeline: {
          monthlyBudget: budgetRanges.find(b => b.value === formData.budget)?.label || formData.budget,
          duration: durationOptions.find(d => d.value === formData.duration)?.label || formData.duration,
          startDate: formData.startDate || null,
        },
        creative: {
          hasCreativeAssets: formData.hasCreativeAssets,
          creativeDescription: formData.creativeDescription || null,
          keyMessages: formData.keyMessages || null,
          callToAction: formData.callToAction || null,
        },
        landingPage: {
          hasLandingPage: formData.hasLandingPage,
          landingPageUrl: formData.landingPageUrl || null,
          needsLandingPage: formData.needsLandingPage,
        },
        metaPresence: {
          hasFacebookPage: formData.hasFacebookPage,
          facebookPageUrl: formData.facebookPageUrl || null,
          hasInstagramAccount: formData.hasInstagramAccount,
          instagramHandle: formData.instagramHandle || null,
          hasMetaAdsAccount: formData.hasMetaAdsAccount,
        },
        additionalInfo: {
          previousAdExperience: formData.previousAdExperience || null,
          competitorSchools: formData.competitorSchools || null,
        },
        additionalNotes: formData.additionalNotes || null,
      };

      await ordersAPI.create({
        shippingInfo: {
          schoolName: effectiveUser?.schoolName || '',
          contactName: effectiveUser?.contactName || '',
          positionTitle: effectiveUser?.positionTitle || 'Meta Ads Campaign',
          principalName: effectiveUser?.principalName || 'N/A',
          email: effectiveUser?.email || '',
          phone: effectiveUser?.phone || '',
        },
        onBehalfOfUserId: isAdmin && selectedUserId ? selectedUserId : undefined,
        notes: formData.additionalNotes || null,
        isCustomRequest: true,
        isMetaAdsCampaign: true,
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
          <p className="text-gray-600 mb-6">Please sign in to submit a Meta Ads campaign request.</p>
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
          <h2 className="text-2xl font-bold text-charcoal mb-4">Campaign Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your Meta Ads campaign request. Our Digital Marketing team will review
            your submission and reach out within 1-2 business days to discuss your campaign strategy.
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
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
            </svg>
            Meta Advertising
          </div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">Digital Ads Campaign</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Launch targeted Facebook and Instagram ad campaigns to reach prospective families
            in your community. Fill out this form to get started with our Digital Marketing team.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Admin: Select User */}
          {isAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Create Campaign Request On Behalf Of
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                As an admin, you can create a Meta Ads campaign request on behalf of an existing user.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => handleUserSelect(e.target.value)}
                  required
                  className="input"
                  disabled={loadingUsers}
                >
                  <option value="">
                    {loadingUsers ? 'Loading users...' : 'Select a user...'}
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.contactName} - {u.schoolName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              {selectedUser && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-amber-100">
                  <p className="text-sm font-medium text-charcoal">{selectedUser.contactName}</p>
                  <p className="text-sm text-gray-600">{selectedUser.schoolName}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email} {selectedUser.phone && `| ${selectedUser.phone}`}</p>
                </div>
              )}
            </div>
          )}

          {/* Show user info for non-admins */}
          {!isAdmin && (
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

          {/* Campaign Objective */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Campaign Objective
            </h2>
            <div className="space-y-3">
              {campaignObjectives.map((objective) => (
                <label
                  key={objective.value}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.campaignObjective === objective.value
                      ? 'border-academica-blue bg-academica-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="campaignObjective"
                    value={objective.value}
                    checked={formData.campaignObjective === objective.value}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                  <div>
                    <span className="font-medium text-charcoal">{objective.label}</span>
                    <p className="text-sm text-gray-500">{objective.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {formData.campaignObjective === 'other' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Please describe your objective *</label>
                <textarea
                  name="otherObjective"
                  value={formData.otherObjective}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="input"
                  placeholder="Describe what you want to achieve with this campaign..."
                />
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
              <input
                type="text"
                name="campaignName"
                value={formData.campaignName}
                onChange={handleChange}
                required
                className="input"
                placeholder="e.g., Fall 2024 Enrollment Drive, Spring Open House Promotion"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Target Audience
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Who do you want to reach? *</label>
                <p className="text-sm text-gray-500 mb-3">Select all that apply:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {targetAudienceOptions.map((audience) => (
                    <label
                      key={audience}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.targetAudiences.includes(audience)
                          ? 'border-academica-blue bg-academica-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.targetAudiences.includes(audience)}
                        onChange={() => handleAudienceChange(audience)}
                        className="rounded"
                      />
                      <span className="text-sm text-charcoal">{audience}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geographic Area *</label>
                  <input
                    type="text"
                    name="geographicArea"
                    value={formData.geographicArea}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="e.g., Miami-Dade County, 33139 zip code area"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Radius (miles) *</label>
                  <select
                    name="radiusMiles"
                    value={formData.radiusMiles}
                    onChange={handleChange}
                    required
                    className="input"
                  >
                    <option value="5">5 miles</option>
                    <option value="10">10 miles</option>
                    <option value="15">15 miles</option>
                    <option value="20">20 miles</option>
                    <option value="25">25 miles</option>
                    <option value="custom">Custom area</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Targeting Criteria (optional)</label>
                <textarea
                  name="additionalTargeting"
                  value={formData.additionalTargeting}
                  onChange={handleChange}
                  rows={2}
                  className="input"
                  placeholder="e.g., Household income, interests in education, specific neighborhoods..."
                />
              </div>
            </div>
          </div>

          {/* Budget & Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Budget & Timeline
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Ad Budget *</label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Select budget range...</option>
                  {budgetRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Does not include management fees</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Duration *</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Select duration...</option>
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desired Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Creative & Content */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Creative & Content
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Do you have creative assets (images/videos)? *</label>
                <select
                  name="hasCreativeAssets"
                  value={formData.hasCreativeAssets}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Select...</option>
                  <option value="yes-ready">Yes, ready to use</option>
                  <option value="yes-needs-adaptation">Yes, but needs adaptation for ads</option>
                  <option value="some">Some, but need more created</option>
                  <option value="no">No, need everything created</option>
                </select>
              </div>

              {formData.hasCreativeAssets && formData.hasCreativeAssets !== 'no' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Describe your available assets</label>
                  <textarea
                    name="creativeDescription"
                    value={formData.creativeDescription}
                    onChange={handleChange}
                    rows={2}
                    className="input"
                    placeholder="e.g., Campus photos, student testimonial videos, previous ad designs..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Messages to Communicate</label>
                <textarea
                  name="keyMessages"
                  value={formData.keyMessages}
                  onChange={handleChange}
                  rows={2}
                  className="input"
                  placeholder="e.g., Free tuition, small class sizes, award-winning programs, enrollment deadline..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desired Call-to-Action</label>
                <input
                  type="text"
                  name="callToAction"
                  value={formData.callToAction}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Schedule a Tour, Apply Now, Learn More, Register for Open House"
                />
              </div>
            </div>
          </div>

          {/* Landing Page */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Landing Page
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Do you have a landing page for this campaign? *
                </label>
                <select
                  name="hasLandingPage"
                  value={formData.hasLandingPage}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes, we have a dedicated landing page</option>
                  <option value="website">We'll use our main website</option>
                  <option value="no">No, we need one created</option>
                </select>
              </div>

              {(formData.hasLandingPage === 'yes' || formData.hasLandingPage === 'website') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landing Page URL</label>
                  <input
                    type="url"
                    name="landingPageUrl"
                    value={formData.landingPageUrl}
                    onChange={handleChange}
                    className="input"
                    placeholder="https://www.yourschool.com/enroll"
                  />
                </div>
              )}

              {formData.hasLandingPage === 'no' && (
                <label className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <input
                    type="checkbox"
                    name="needsLandingPage"
                    checked={formData.needsLandingPage}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <div>
                    <span className="font-medium text-charcoal">I need a landing page created</span>
                    <p className="text-sm text-gray-600">Our team can create a conversion-optimized landing page for your campaign (additional cost)</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Meta/Facebook Presence */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
              </svg>
              Meta/Facebook Presence
            </h2>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Does your school have a Facebook Page? *</label>
                  <select
                    name="hasFacebookPage"
                    value={formData.hasFacebookPage}
                    onChange={handleChange}
                    required
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="not-sure">Not sure</option>
                  </select>
                </div>
                {formData.hasFacebookPage === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Page URL</label>
                    <input
                      type="url"
                      name="facebookPageUrl"
                      value={formData.facebookPageUrl}
                      onChange={handleChange}
                      className="input"
                      placeholder="https://www.facebook.com/yourschool"
                    />
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Does your school have an Instagram account?</label>
                  <select
                    name="hasInstagramAccount"
                    value={formData.hasInstagramAccount}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="not-sure">Not sure</option>
                  </select>
                </div>
                {formData.hasInstagramAccount === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                      <input
                        type="text"
                        name="instagramHandle"
                        value={formData.instagramHandle}
                        onChange={handleChange}
                        className="input pl-8"
                        placeholder="yourschool"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Do you have an existing Meta Ads account?</label>
                <select
                  name="hasMetaAdsAccount"
                  value={formData.hasMetaAdsAccount}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes, we've run ads before</option>
                  <option value="no">No, this is our first time</option>
                  <option value="not-sure">Not sure</option>
                </select>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous advertising experience</label>
                <textarea
                  name="previousAdExperience"
                  value={formData.previousAdExperience}
                  onChange={handleChange}
                  rows={2}
                  className="input"
                  placeholder="Have you run digital ads before? What worked or didn't work?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competitor schools in your area</label>
                <textarea
                  name="competitorSchools"
                  value={formData.competitorSchools}
                  onChange={handleChange}
                  rows={2}
                  className="input"
                  placeholder="List any competing schools you're aware of in your target area..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anything else we should know?</label>
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
                Our Digital Marketing team will review your request and follow up within 1-2 business days
                with a campaign proposal.
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
                  'Submit Campaign Request'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
