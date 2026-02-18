import React from 'react';

interface FilterBarProps {
  searchPlaceholder?: string;
  filters: Array<{
    key: string;
    options: Array<{ label: string; value: string }>;
    value: string;
    onChange: (value: string) => void;
  }>;
  onSearchChange: (value: string) => void;
  searchValue?: string;
  resultCount?: number;
  totalCount?: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = 'Search...',
  filters,
  onSearchChange,
  searchValue = '',
  resultCount,
  totalCount,
}) => {
  const [focused, setFocused] = React.useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--surface-2)',
  };

  const searchWrapperStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    maxWidth: 280,
  };

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 13,
    pointerEvents: 'none',
    lineHeight: 1,
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 12px 7px 32px',
    borderRadius: 7,
    border: `1px solid ${focused ? 'var(--brand-mid)' : 'var(--border)'}`,
    fontSize: 13,
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    padding: '7px 10px',
    borderRadius: 7,
    border: '1px solid var(--border)',
    fontSize: 13,
    background: '#fff',
    outline: 'none',
  };

  const countStyle: React.CSSProperties = {
    marginLeft: 'auto',
    fontSize: 12,
    color: 'var(--text-muted)',
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={searchWrapperStyle}>
        <span style={searchIconStyle}>&#x1F50D;</span>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={searchInputStyle}
        />
      </div>
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          style={selectStyle}
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {resultCount !== undefined && totalCount !== undefined && (
        <span style={countStyle}>
          Showing {resultCount} of {totalCount}
        </span>
      )}
    </div>
  );
};

export default FilterBar;
