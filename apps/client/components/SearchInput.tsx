// Reusable search input component
import { ChangeEvent, FormEvent, useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  onClear?: () => void;
}

export default function SearchInput({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
  onClear,
}: SearchInputProps) {
  const [value, setValue] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setValue(query);

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    setDebounceTimer(timer);
  };

  const handleClear = () => {
    setValue("");
    onClear?.();
    onSearch("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form className="search-input-wrapper" onSubmit={handleSubmit}>
      <div className="search-input-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
        />
        {value && (
          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </form>
  );
}
