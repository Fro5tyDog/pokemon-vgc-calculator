import React, { useState, useRef, useEffect } from 'react';

/**
 * A text-search dropdown for large option lists (1000+ Pokémon, 900+ moves)
 * where native <select> type-ahead falls over — browsers only buffer
 * keystrokes for a very short window, so typing "last resp" often resets
 * partway through and matches "Last Resort" instead of "Last Respects".
 * This just filters a plain list as you type, with no reset window.
 *
 * @param {Array<{name: string, apiName: string}>} options
 * @param {string} value - currently selected apiName
 * @param {(apiName: string) => void} onChange
 * @param {string} placeholder - shown on the closed trigger when nothing's picked
 * @param {boolean} disabled
 * @param {object} triggerStyle - style overrides for the closed trigger button
 * @param {number} maxResults - cap on rendered matches (perf, default 50)
 */
export default function SearchableSelect({ options, value, onChange, placeholder, disabled, triggerStyle, maxResults = 50, fixedTriggerLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selected = options.find((o) => o.apiName === value);

  const filtered = (query
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options
  ).slice(0, maxResults);

  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    setQuery('');
    setHighlightIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const pick = (apiName) => {
    onChange(apiName);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightIndex]) pick(filtered[highlightIndex].apiName);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {!isOpen ? (
        <button
          type="button"
          onClick={openDropdown}
          disabled={disabled}
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            font: 'inherit',
            color: 'inherit',
            cursor: disabled ? 'default' : 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: 0,
            ...triggerStyle,
          }}
        >
          {fixedTriggerLabel || selected?.name || placeholder || 'Select...'}
        </button>
      ) : (
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type to search..."
          style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', padding: '2px 4px' }}
        />
      )}

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 20,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginTop: '2px',
            maxHeight: '220px',
            overflowY: 'auto',
            width: 'max-content',
            minWidth: '200px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: '6px 10px', color: '#999', fontSize: '0.9em' }}>No matches</div>
          )}
          {filtered.map((o, i) => (
            <div
              key={o.apiName}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus so the click registers before blur closes the list
                pick(o.apiName);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
              style={{
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '0.9em',
                color: '#000',
                background: i === highlightIndex ? '#eef4ff' : 'transparent',
                whiteSpace: 'nowrap',
              }}
            >
              {o.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
