import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const USER_TYPE_LABELS = {
  school_staff: 'School Staff Member',
  academica_employee: 'Academica Employee',
  admin: 'Administrator',
};

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    contactName: user?.contactName || '',
    positionTitle: user?.positionTitle || '',
    department: user?.department || '',
    schoolName: user?.schoolName || '',
    principalName: user?.principalName || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Password change state
  const isMigrationMode = user?.passwordNeedsUpdate || searchParams.get('updatePassword') === 'true';
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const userType = user?.userType || 'school_staff';
  const isAdmin = user?.role === 'admin';
  const isSchoolStaff = userType === 'school_staff';
  const isAcademicaEmployee = userType === 'academica_employee';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordSuccess('');
    setPasswordError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword({
        currentPassword: isMigrationMode ? undefined : passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      {/* Password Migration Banner */}
      {isMigrationMode && !passwordSuccess && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Our password system has been updated
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Please choose a new password below. Your old password will continue to work until you set a new one.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-8">
        {/* Account Info */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="text-lg font-medium text-gray-900">
                {USER_TYPE_LABELS[userType] || userType}
                {isAdmin && <span className="ml-2 text-sm text-academica-blue">(Admin)</span>}
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              required
              className="input"
              placeholder="Enter your name"
            />
          </div>

          {/* Position/Title */}
          <div>
            <label htmlFor="positionTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Position/Title
            </label>
            <input
              type="text"
              id="positionTitle"
              name="positionTitle"
              value={formData.positionTitle}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Marketing Coordinator"
            />
          </div>

          {/* School Staff Fields */}
          {isSchoolStaff && (
            <>
              <div>
                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Enter your school name"
                />
              </div>

              <div>
                <label htmlFor="principalName" className="block text-sm font-medium text-gray-700 mb-1">
                  Principal's Name
                </label>
                <input
                  type="text"
                  id="principalName"
                  name="principalName"
                  value={formData.principalName}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Dr. Jane Smith"
                />
              </div>
            </>
          )}

          {/* Academica Employee Fields */}
          {isAcademicaEmployee && (
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Marketing, Operations"
              />
            </div>
          )}

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
              placeholder="Enter your phone number"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              {isSchoolStaff ? 'School Address' : 'Office Address'}
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Enter your address"
            />
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
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>

        {passwordSuccess && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-6">
            {passwordSuccess}
          </div>
        )}

        {passwordError && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          {/* Current Password - hidden in migration mode */}
          {!isMigrationMode && (
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required={!isMigrationMode}
                className="input"
                placeholder="Enter your current password"
              />
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              minLength={6}
              className="input"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              className="input"
              placeholder="Re-enter your new password"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full btn btn-primary py-3"
          >
            {passwordLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
