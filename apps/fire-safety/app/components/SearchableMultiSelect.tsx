"use client";
import Select, { StylesConfig, MultiValue } from "react-select";
import { useTheme } from "../utils/theme-context";

interface Option {
  value: string | number;
  label: string;
}

interface SearchableMultiSelectProps {
  label: string;
  emoji?: string;
  options: (string | number)[];
  selected: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
}

export default function SearchableMultiSelect({
  label,
  emoji,
  options,
  selected,
  onChange,
  placeholder = "Search and select...",
}: SearchableMultiSelectProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const selectOptions: Option[] = options.map((opt) => ({
    value: opt,
    label: String(opt),
  }));

  const selectedOptions = selectOptions.filter((opt) =>
    selected.includes(opt.value)
  );

  const handleChange = (newValue: MultiValue<Option>) => {
    onChange(newValue.map((v) => v.value));
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);
  
  // If no label provided, hide the header section
  const showHeader = label.length > 0;

  const customStyles: StylesConfig<Option, true> = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderColor: state.isFocused
        ? isDark ? "#3b82f6" : "#2563eb"
        : isDark ? "#374151" : "#d1d5db",
      borderRadius: "0.75rem",
      minHeight: "42px",
      boxShadow: state.isFocused ? `0 0 0 2px ${isDark ? "#3b82f680" : "#2563eb40"}` : "none",
      "&:hover": {
        borderColor: isDark ? "#4b5563" : "#9ca3af",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderRadius: "0.75rem",
      border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
      boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      zIndex: 50,
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: "200px",
      padding: "4px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? isDark ? "#3b82f6" : "#2563eb"
        : state.isFocused
        ? isDark ? "#374151" : "#f3f4f6"
        : "transparent",
      color: state.isSelected
        ? "#ffffff"
        : isDark ? "#e5e7eb" : "#1f2937",
      borderRadius: "0.5rem",
      padding: "8px 12px",
      cursor: "pointer",
      "&:active": {
        backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? "#3b82f6" : "#dbeafe",
      borderRadius: "0.5rem",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDark ? "#ffffff" : "#1e40af",
      fontSize: "0.75rem",
      padding: "2px 6px",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDark ? "#ffffff" : "#1e40af",
      borderRadius: "0 0.5rem 0.5rem 0",
      "&:hover": {
        backgroundColor: isDark ? "#2563eb" : "#bfdbfe",
        color: isDark ? "#ffffff" : "#1e3a8a",
      },
    }),
    input: (base) => ({
      ...base,
      color: isDark ? "#e5e7eb" : "#1f2937",
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? "#6b7280" : "#9ca3af",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
      ...base,
      color: isDark ? "#6b7280" : "#9ca3af",
      "&:hover": {
        color: isDark ? "#9ca3af" : "#6b7280",
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: isDark ? "#6b7280" : "#9ca3af",
      "&:hover": {
        color: isDark ? "#ef4444" : "#dc2626",
      },
    }),
  };

  return (
    <div className="space-y-2">
      {showHeader && (
        <>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-300 dark:text-gray-300 light:text-gray-700">
              {emoji && <span className="mr-2">{emoji}</span>}
              {label}
            </label>
            <span className="text-xs text-gray-500">
              {selected.length} of {options.length}
            </span>
          </div>

          <div className="flex gap-2 mb-2">
            <button
              onClick={selectAll}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            >
              Clear All
            </button>
          </div>
        </>
      )}

      <Select<Option, true>
        isMulti
        options={selectOptions}
        value={selectedOptions}
        onChange={handleChange}
        placeholder={placeholder}
        styles={customStyles}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        isClearable
        isSearchable
      />
    </div>
  );
}

