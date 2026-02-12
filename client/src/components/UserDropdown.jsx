import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';

const USER_TYPE_LABELS = {
  school_staff: 'School Staff',
  academica_employee: 'Academica',
  admin: 'Admin',
  superadmin: 'Super Admin',
  guest: 'Quick Added',
};

const USER_TYPE_COLORS = {
  school_staff: 'bg-green-100 text-green-700',
  academica_employee: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
  superadmin: 'bg-red-100 text-red-700',
  guest: 'bg-orange-100 text-orange-700',
};

export default function UserDropdown({
  value,
  onChange,
  onClear,
  onCreateNew,
  disabled = false,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search term when value changes externally
  useEffect(() => {
    if (value) {
      const selectedUser = users.find(u => u.id === value);
      if (selectedUser) {
        setSearchTerm(selectedUser.contactName || selectedUser.email);
      }
    } else {
      setSearchTerm('');
    }
  }, [value, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      user.contactName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.schoolName?.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query)
    );
  });

  const handleSelect = (user) => {
    setSearchTerm(user.contactName || user.email);
    onChange(user.id, user);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (value) {
      onClear();
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onClear();
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="input bg-gray-50 text-gray-500">
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="input bg-red-50 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search by name, email, school..."
          disabled={disabled}
          className="input pr-8 w-full text-sm"
        />
        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                  value === user.id ? 'bg-academica-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-charcoal text-sm">{user.contactName || 'No Name'}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${USER_TYPE_COLORS[user.userType] || USER_TYPE_COLORS.school_staff}`}>
                    {USER_TYPE_LABELS[user.userType] || 'Staff'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
                {user.schoolName && (
                  <div className="text-xs text-gray-400">{user.schoolName}</div>
                )}
                {user.department && (
                  <div className="text-xs text-gray-400">{user.department}</div>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? 'No users found matching your search' : 'No users available'}
            </div>
          )}

          {/* Create New User button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onCreateNew();
            }}
            className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border-t border-gray-200 text-sm font-medium text-academica-blue flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New User
          </button>
        </div>
      )}
    </div>
  );
}
