"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional secondary text shown smaller */
  hint?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
  /** Allow the user to type values not in the list */
  allowCustom?: boolean;
}

/**
 * A searchable dropdown that also allows free-text input.
 * Combines the UX of a dropdown with the flexibility of a text input.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Type to search…",
  disabled = false,
  id,
  "aria-label": ariaLabel,
  className = "",
  allowCustom = true,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Sync search text when value changes externally
  useEffect(() => {
    setSearch(value);
  }, [value]);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If user typed custom value and allowCustom, keep it
        if (allowCustom && search.trim()) {
          onChange(search.trim());
        } else if (!allowCustom) {
          // Reset to last valid value
          setSearch(value);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [allowCustom, onChange, search, value]);

  const selectOption = useCallback(
    (opt: ComboboxOption) => {
      setSearch(opt.label);
      onChange(opt.value);
      setIsOpen(false);
      setHighlightIndex(-1);
    },
    [onChange]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setSearch(v);
    setIsOpen(true);
    setHighlightIndex(-1);
    if (allowCustom) {
      onChange(v);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const highlighted = filtered[highlightIndex];
      if (highlightIndex >= 0 && highlighted) {
        selectOption(highlighted);
      } else if (allowCustom && search.trim()) {
        onChange(search.trim());
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("li");
      items[highlightIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={id ? `${id}-listbox` : undefined}
        autoComplete="off"
        value={search}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 disabled:opacity-50"
      />
      {/* Dropdown chevron */}
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
        onClick={() => {
          setIsOpen(!isOpen);
          inputRef.current?.focus();
        }}
        disabled={disabled}
        aria-hidden="true"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown list */}
      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white py-1 shadow-lg"
        >
          {filtered.map((opt, i) => (
            <li
              key={opt.value + i}
              role="option"
              aria-selected={highlightIndex === i}
              className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                highlightIndex === i
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted/50"
              } ${opt.value === value ? "font-medium" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur before click
                selectOption(opt);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <span>{opt.label}</span>
              {opt.hint && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {opt.hint}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
