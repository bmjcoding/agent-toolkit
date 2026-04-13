interface FilterGroup {
  label: string;
  options: string[];
}

interface FilterBarProps {
  groups: FilterGroup[];
  selected: Record<string, string>;
  onChange: (group: string, value: string) => void;
}

export function FilterBar({ groups, selected, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {groups.map((group) => (
        <div key={group.label} className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {group.label}
          </span>
          <div className="flex gap-1">
            {group.options.map((option) => (
              <button
                key={option}
                onClick={() => onChange(group.label, option)}
                aria-pressed={selected[group.label] === option}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 dark:focus-visible:ring-white focus-visible:ring-offset-2 ${
                  selected[group.label] === option
                    ? 'bg-primary/10 text-primary dark:bg-primary-light/10 dark:text-primary-light border border-primary/20 dark:border-primary-light/20'
                    : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
