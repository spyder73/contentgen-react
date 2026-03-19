import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  rightLabel?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  buttonClassName?: string;
  loading?: boolean;
  ariaLabel?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchable = false,
  className = '',
  buttonClassName = '',
  loading = false,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  return (
    <div className={`relative min-w-0 ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        className={`select w-full min-w-0 flex items-center justify-between gap-2 ${buttonClassName}`}
      >
        {loading ? (
          <span className="text-muted">Loading...</span>
        ) : selectedOption ? (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="truncate">{selectedOption.label}</span>
            {selectedOption.rightLabel && (
              <span className="text-success text-xs ml-2">{selectedOption.rightLabel}</span>
            )}
          </div>
        ) : (
          <span className="text-muted">{placeholder}</span>
        )}
        <span className="text-muted">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="dropdown left-0 right-0 w-full max-w-full max-h-96 flex flex-col animate-fade-in">
          {searchable && (
            <div className="p-2 border-b border-slate-600">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="input input-sm"
                autoFocus
              />
            </div>
          )}

          <div className="overflow-y-auto overflow-x-hidden">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-muted text-center text-sm">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={value === option.value ? 'dropdown-item-active' : 'dropdown-item'}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm truncate">{option.label}</p>
                      {option.sublabel && (
                        <p className="text-muted text-xs truncate">{option.sublabel}</p>
                      )}
                    </div>
                    {option.rightLabel && (
                      <span className="text-success text-xs ml-2 shrink-0">
                        {option.rightLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
