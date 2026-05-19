import { useState, useEffect, useRef } from 'react';

const MobileSearchBar = ({ theme, onSearch, isCompactMobile }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setSearchValue('');
    onSearch('');
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  if (!isCompactMobile) return null;

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={handleExpand}
        className="w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300"
        style={{
          background: theme.subtle,
          color: theme.text,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 animate-slide-down"
      style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        boxShadow: `0 10px 32px ${theme.shadow}`,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={handleClose}
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
          style={{ color: theme.muted }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div
          className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: theme.subtle,
            border: `1px solid ${theme.border}`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={handleChange}
            placeholder="Search users by name or email..."
            className="flex-1 border-none bg-transparent outline-none text-sm"
            style={{ color: theme.text }}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue('');
                onSearch('');
              }}
              className="shrink-0 border-none bg-transparent cursor-pointer p-1"
              style={{ color: theme.muted }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileSearchBar;