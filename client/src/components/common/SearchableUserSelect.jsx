import { useState, useRef, useEffect } from 'react';

export default function SearchableUserSelect({ users, selectedUserId, onSelect, loading, placeholder = 'Search by name, school, or email...' }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? users.filter((u) => {
        const q = query.toLowerCase();
        return (
          (u.contactName || '').toLowerCase().includes(q) ||
          (u.schoolName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
        );
      })
    : users;

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleSelect = (user) => {
    onSelect(user.id);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect('');
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Select User *</label>

      {/* Selected state */}
      {selectedUser && !isOpen ? (
        <button
          type="button"
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
          className="w-full text-left input flex items-center justify-between"
        >
          <span className="truncate">
            <span className="font-medium">{selectedUser.contactName}</span>
            <span className="text-gray-500"> — {selectedUser.schoolName}</span>
          </span>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder={loading ? 'Loading users...' : placeholder}
            disabled={loading}
            className="input pl-9 pr-8"
          />
          {(query || selectedUserId) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !loading && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              {query ? 'No users match your search' : 'No users available'}
            </div>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelect(u)}
                className={`w-full text-left px-4 py-2.5 hover:bg-academica-blue-50 transition-colors border-b border-gray-100 last:border-0 ${
                  u.id === selectedUserId ? 'bg-academica-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">{u.contactName}</p>
                    <p className="text-xs text-gray-500 truncate">{u.schoolName} — {u.email}</p>
                  </div>
                  {u.id === selectedUserId && (
                    <svg className="w-4 h-4 text-academica-blue flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
