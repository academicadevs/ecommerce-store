import { useState, useEffect, useRef } from 'react';
import { officesAPI } from '../services/api';

export default function OfficeDropdown({
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
}) {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Load offices on mount
  useEffect(() => {
    loadOffices();
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
      const selectedOffice = offices.find(o => o.id === value);
      if (selectedOffice) {
        setSearchTerm(selectedOffice.name);
      }
    } else {
      setSearchTerm('');
    }
  }, [value, offices]);

  const loadOffices = async () => {
    try {
      setLoading(true);
      const response = await officesAPI.getActive();
      setOffices(response.data.offices || []);
    } catch (err) {
      console.error('Failed to load offices:', err);
      setError('Failed to load offices');
    } finally {
      setLoading(false);
    }
  };

  const filteredOffices = offices.filter(office =>
    office.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (office) => {
    setSearchTerm(office.name);
    onChange(office.id);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    // Clear selection when user types
    if (value) {
      onChange('');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`input bg-gray-50 text-gray-500 ${className}`}>
        Loading offices...
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
          placeholder="Search and select an office..."
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
          {filteredOffices.length > 0 ? (
            filteredOffices.map(office => (
              <button
                key={office.id}
                type="button"
                onClick={() => handleSelect(office)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                  value === office.id ? 'bg-academica-blue-50' : ''
                }`}
              >
                <div className="font-medium text-charcoal text-sm">{office.name}</div>
                {(office.city || office.state) && (
                  <div className="text-xs text-gray-400">
                    {[office.city, office.state].filter(Boolean).join(', ')}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? 'No offices found matching your search' : 'No offices available'}
            </div>
          )}
        </div>
      )}

      {value && (
        <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Office selected
        </div>
      )}
    </div>
  );
}
