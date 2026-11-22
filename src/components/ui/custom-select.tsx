"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";
import { CustomSelectProps } from "@/types/ui.types";

export function CustomSelect({
  name,
  value: controlledValue,
  defaultValue,
  options,
  onChange,
  placeholder = "Select an option",
  label,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  menuMaxHeight = "max-h-48",
  icon: LeadingIcon,
  disabled = false,
  required = false,
  searchable = true,
}: CustomSelectProps) {
  const [internalValue, setInternalValue] = useState<string>(
    controlledValue !== undefined
      ? controlledValue
      : defaultValue !== undefined
        ? defaultValue
        : ""
  );
  const [isOpen, setIsOpen] = useState(false);
  const [typeaheadQuery, setTypeaheadQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal value if controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Reset typeahead when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setTypeaheadQuery("");
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(internalValue)
  );

  const filteredOptions = typeaheadQuery.trim()
    ? options.filter(
        (opt) =>
          opt.label
            .toLowerCase()
            .includes(typeaheadQuery.toLowerCase().trim()) ||
          (opt.sublabel &&
            opt.sublabel
              .toLowerCase()
              .includes(typeaheadQuery.toLowerCase().trim())) ||
          String(opt.value)
            .toLowerCase()
            .includes(typeaheadQuery.toLowerCase().trim())
      )
    : options;

  const handleSelect = useCallback(
    (val: string) => {
      setInternalValue(val);
      setTypeaheadQuery("");
      setIsOpen(false);
      onChange?.(val);
    },
    [onChange]
  );

  // Keyboard navigation & direct typing listener when dropdown is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes dropdown or clears typeahead
      if (e.key === "Escape") {
        e.preventDefault();
        if (typeaheadQuery) {
          setTypeaheadQuery("");
          setHighlightedIndex(0);
        } else {
          setIsOpen(false);
        }
        return;
      }

      // Enter selects highlighted match
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions.length > 0) {
          const target =
            filteredOptions[highlightedIndex] || filteredOptions[0];
          if (target) {
            handleSelect(String(target.value));
          }
        }
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          Math.min(prev + 1, Math.max(0, filteredOptions.length - 1))
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      // Backspace removes last typed character
      if (e.key === "Backspace") {
        if (typeaheadQuery) {
          e.preventDefault();
          setTypeaheadQuery((prev) => prev.slice(0, -1));
          setHighlightedIndex(0);
        }
        return;
      }

      // Direct letter / number typing for search
      if (
        searchable &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setTypeaheadQuery((prev) => prev + e.key.toLowerCase());
        setHighlightedIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    typeaheadQuery,
    filteredOptions,
    highlightedIndex,
    handleSelect,
    searchable,
  ]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-neutral-300 mb-2">
          {label}
        </label>
      )}

      {/* Hidden input for native HTML form submissions & Server Actions */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={internalValue}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-10 flex items-center justify-between gap-2 bg-surface hover:bg-surface-hover active:bg-surface-elevated text-white border rounded-xl px-3.5 text-xs font-medium transition-all duration-150 focus:outline-none ${
          isOpen
            ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/5"
            : "border-border-muted hover:border-border-hover"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {LeadingIcon && (
            <LeadingIcon className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          )}
          {selectedOption?.icon && (
            <selectedOption.icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          )}
          <span
            className={`truncate ${
              selectedOption ? "text-white" : "text-neutral-500 font-normal"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Floating Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`absolute left-0 right-0 z-50 mt-1.5 min-w-[160px] bg-surface-modal/95 backdrop-blur-xl border border-border-muted rounded-xl shadow-2xl shadow-black/90 p-1 ring-1 ring-white/5 overflow-hidden ${menuClassName}`}
          >
            {typeaheadQuery && (
              <div className="flex items-center justify-between px-2.5 py-1 text-[11px] text-neutral-400 bg-surface border-b border-border-subtle/80 rounded-t-lg mb-1">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                    Search:
                  </span>
                  <span className="text-primary font-semibold">
                    {typeaheadQuery}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTypeaheadQuery("");
                    setHighlightedIndex(0);
                  }}
                  className="text-neutral-500 hover:text-white ml-2 flex-shrink-0 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <ul
              role="listbox"
              tabIndex={-1}
              className={`${menuMaxHeight} overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent focus:outline-none`}
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-3 text-xs text-neutral-500 text-center">
                  {typeaheadQuery
                    ? `No options matching "${typeaheadQuery}"`
                    : "No options available"}
                </li>
              ) : (
                filteredOptions.map((option, idx) => {
                  const isSelected =
                    String(option.value) === String(internalValue);
                  const isHighlighted = idx === highlightedIndex;
                  const OptionIcon = option.icon;

                  return (
                    <li
                      key={String(option.value)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(String(option.value))}
                      className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-150 select-none ${
                        isSelected
                          ? "bg-primary-tint text-primary font-semibold border border-primary/20"
                          : isHighlighted && typeaheadQuery
                            ? "bg-surface-hover text-white border border-border-muted"
                            : "text-neutral-300 hover:text-white hover:bg-surface-hover"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {OptionIcon && (
                          <OptionIcon
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              isSelected
                                ? "text-primary"
                                : "text-neutral-400 group-hover:text-neutral-300"
                            }`}
                          />
                        )}
                        <div>
                          <p className="truncate leading-tight">
                            {option.label}
                          </p>
                          {option.sublabel && (
                            <p className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">
                              {option.sublabel}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 ml-2" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
