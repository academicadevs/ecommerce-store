import { useState, useEffect, useRef } from 'react';
import { schoolsAPI } from '../services/api';

export default function SchoolDropdown({
  value,
  onChange,
  onPrincipalChange,
  onSchoolNameChange,
  required = false,
  disabled = false,
  className = '',
}) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Load schools on mount
  useEffect(() => {
    loadSchools();
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
      const selectedSchool = schools.find(s => s.id === value);
      if (selectedSchool) {
        setSearchTerm(selectedSchool.name);
      }
    } else {
      setSearchTerm('');
    }
  }, [value, schools]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await schoolsAPI.getActive();
      setSchools(response.data.schools || []);
    } catch (err) {
      console.error('Failed to load schools:', err);
      setError('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (school) => {
    setSearchTerm(school.name);
    onChange(school.id);
    if (onSchoolNameChange) {
      onSchoolNameChange(school.name);
    }
    if (onPrincipalChange && school.principal_name) {
      onPrincipalChange(school.principal_name);
    }
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    // Clear selection when user types
    if (value) {
      onChange('');
      if (onSchoolNameChange) {
        onSchoolNameChange('');
      }
      if (onPrincipalChange) {
        onPrincipalChange('');
      }
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    if (onSchoolNameChange) {
      onSchoolNameChange('');
    }
    if (onPrincipalChange) {
      onPrincipalChange('');
    }
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`input bg-gray-50 text-gray-500 ${className}`}>
        Loading schools...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`input bg-red-50 text-red-500 ${className}`}>
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
          placeholder="Search and select a school..."
          required={required}
          disabled={disabled}
          className={`input pr-8 ${className}`}
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
          {filteredSchools.length > 0 ? (
            filteredSchools.map(school => (
              <button
                key={school.id}
                type="button"
                onClick={() => handleSelect(school)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                  value === school.id ? 'bg-academica-blue-50' : ''
                }`}
              >
                <div className="font-medium text-charcoal text-sm">{school.name}</div>
                {school.principal_name && (
                  <div className="text-xs text-gray-500">
                    Principal: {school.principal_name}
                  </div>
                )}
                {(school.city || school.state) && (
                  <div className="text-xs text-gray-400">
                    {[school.city, school.state].filter(Boolean).join(', ')}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? 'No schools found matching your search' : 'No schools available'}
            </div>
          )}
        </div>
      )}

      {value && (
        <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          School selected
        </div>
      )}
    </div>
  );
}
