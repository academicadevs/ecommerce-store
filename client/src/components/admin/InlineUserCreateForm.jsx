import { useState } from 'react';
import { adminAPI } from '../../services/api';
import SchoolDropdown from '../SchoolDropdown';
import OfficeDropdown from '../OfficeDropdown';

export default function InlineUserCreateForm({ onCreated, onCancel, defaultEmail = '' }) {
  const [formData, setFormData] = useState({
    email: defaultEmail,
    middleName: '',
    contactName: '',
    userType: 'school_staff',
    school_id: '',
    principalName: '',
    supervisor: '',
    positionTitle: '',
    department: '',
    office_id: '',
    phone: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const isStaffUserType = formData.userType === 'school_staff' || formData.userType === 'academica_employee';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await adminAPI.createUser(formData);
      onCreated(response.data.user);
    } catch (err) {
      console.error('Failed to create user:', err);
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const update = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">User Type *</label>
        <select
          value={formData.userType}
          onChange={(e) => update('userType', e.target.value)}
          className="input w-full text-sm"
        >
          <option value="school_staff">School Staff Member</option>
          <option value="academica_employee">Academica Employee</option>
        </select>
      </div>

      {isStaffUserType && (
        <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
          <p className="text-xs text-blue-800">
            <span className="font-medium">Note:</span> Staff members use their middle name as their password.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => update('email', e.target.value)}
            required
            className="input w-full text-sm"
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Middle Name *</label>
          <input
            type="text"
            value={formData.middleName}
            onChange={(e) => update('middleName', e.target.value)}
            required
            minLength={2}
            className="input w-full text-sm"
            placeholder="Used as password"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Contact Name *</label>
        <input
          type="text"
          value={formData.contactName}
          onChange={(e) => update('contactName', e.target.value)}
          required
          className="input w-full text-sm"
          placeholder="John Smith"
        />
      </div>

      {formData.userType === 'school_staff' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">School *</label>
            <SchoolDropdown
              value={formData.school_id}
              onChange={(schoolId) => update('school_id', schoolId)}
              onPrincipalChange={(principalName) => update('principalName', principalName)}
            />
          </div>
          {formData.principalName && (
            <div className="bg-gray-50 rounded px-2 py-1.5 text-xs">
              <span className="font-medium text-gray-700">Principal: </span>
              <span className="text-gray-600">{formData.principalName}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Supervisor</label>
            <input
              type="text"
              value={formData.supervisor}
              onChange={(e) => update('supervisor', e.target.value)}
              className="input w-full text-sm"
              placeholder="Direct supervisor"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Position/Title</label>
            <input
              type="text"
              value={formData.positionTitle}
              onChange={(e) => update('positionTitle', e.target.value)}
              className="input w-full text-sm"
              placeholder="Marketing Coordinator"
            />
          </div>
        </>
      )}

      {formData.userType === 'academica_employee' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Office *</label>
            <OfficeDropdown
              value={formData.office_id}
              onChange={(officeId) => update('office_id', officeId)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => update('department', e.target.value)}
              className="input w-full text-sm"
              placeholder="Marketing"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Position/Title</label>
            <input
              type="text"
              value={formData.positionTitle}
              onChange={(e) => update('positionTitle', e.target.value)}
              className="input w-full text-sm"
              placeholder="Marketing Manager"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="input w-full text-sm"
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={creating}
          className="px-3 py-1.5 text-sm bg-academica-blue text-white rounded hover:bg-academica-blue-dark disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create User'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={creating}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
