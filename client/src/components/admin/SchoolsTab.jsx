import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

export default function SchoolsTab() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // User list modal
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolUsers, setSchoolUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    principal_name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    district: '',
    is_active: true,
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSchools();
      setSchools(response.data.schools || []);
    } catch (error) {
      console.error('Failed to load schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(school => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      school.name?.toLowerCase().includes(query) ||
      school.principal_name?.toLowerCase().includes(query) ||
      school.city?.toLowerCase().includes(query) ||
      school.state?.toLowerCase().includes(query) ||
      school.district?.toLowerCase().includes(query)
    );
  });

  const handleOpenAddModal = () => {
    setEditingSchool(null);
    setFormData({
      name: '',
      principal_name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      email: '',
      district: '',
      is_active: true,
    });
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name || '',
      principal_name: school.principal_name || '',
      address: school.address || '',
      city: school.city || '',
      state: school.state || '',
      zip: school.zip || '',
      phone: school.phone || '',
      email: school.email || '',
      district: school.district || '',
      is_active: school.is_active !== false,
    });
    setModalError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchool(null);
    setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSaving(true);

    try {
      if (editingSchool) {
        await adminAPI.updateSchool(editingSchool.id, formData);
      } else {
        await adminAPI.createSchool(formData);
      }
      handleCloseModal();
      loadSchools();
    } catch (error) {
      console.error('Failed to save school:', error);
      setModalError(error.response?.data?.error || 'Failed to save school');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (school) => {
    try {
      await adminAPI.toggleSchoolActive(school.id);
      loadSchools();
    } catch (error) {
      console.error('Failed to toggle school status:', error);
      alert('Failed to update school status');
    }
  };

  const handleViewUsers = async (school) => {
    setSelectedSchool(school);
    setShowUsersModal(true);
    setLoadingUsers(true);

    try {
      const response = await adminAPI.getSchoolUsers(school.id);
      setSchoolUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to load school users:', error);
      setSchoolUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCloseUsersModal = () => {
    setShowUsersModal(false);
    setSelectedSchool(null);
    setSchoolUsers([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-gray-600">
            {filteredSchools.length === schools.length
              ? `${schools.length} schools`
              : `${filteredSchools.length} of ${schools.length} schools`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>
          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add School
          </button>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Principal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-charcoal">{school.name}</div>
                    {school.email && (
                      <div className="text-xs text-gray-500">{school.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{school.principal_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {[school.city, school.state].filter(Boolean).join(', ') || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{school.district || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewUsers(school)}
                      className="text-sm text-academica-blue hover:text-academica-blue-600 font-medium"
                    >
                      {school.user_count || 0} users
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      school.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(school)}
                        className={`p-2 rounded-lg transition-colors ${
                          school.is_active
                            ? 'text-gray-500 hover:bg-gray-100'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={school.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {school.is_active ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(school)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSchools.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? 'No schools match your search' : 'No schools found. Add your first school to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit School Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-charcoal">
                {editingSchool ? 'Edit School' : 'Add New School'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="input w-full"
                  placeholder="Academica Charter School"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Principal's Name
                </label>
                <input
                  type="text"
                  name="principal_name"
                  value={formData.principal_name}
                  onChange={handleFormChange}
                  className="input w-full"
                  placeholder="Dr. Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleFormChange}
                  className="input w-full"
                  placeholder="School District Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="input w-full"
                  placeholder="123 School Street"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    className="input w-full"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleFormChange}
                    className="input w-full"
                    placeholder="FL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleFormChange}
                    className="input w-full"
                    placeholder="33139"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="input w-full"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="input w-full"
                    placeholder="school@example.com"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleFormChange}
                  className="w-4 h-4 text-academica-blue border-gray-300 rounded focus:ring-academica-blue"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  School is active (visible in dropdown)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : (editingSchool ? 'Save Changes' : 'Add School')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* School Users Modal */}
      {showUsersModal && selectedSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-charcoal">Users at {selectedSchool.name}</h2>
                <p className="text-sm text-gray-500">{schoolUsers.length} user{schoolUsers.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={handleCloseUsersModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : schoolUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p>No users assigned to this school</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schoolUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-academica-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-academica-blue font-semibold">
                          {user.contactName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-charcoal truncate">{user.contactName}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        {user.positionTitle && (
                          <p className="text-xs text-gray-400">{user.positionTitle}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleCloseUsersModal}
                className="w-full btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
