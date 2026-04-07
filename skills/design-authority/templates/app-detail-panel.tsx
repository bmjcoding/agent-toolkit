import { useState } from 'react';

interface AppDetailPanelProps {
  title: string;
  subtitle?: string;
  tabs: readonly string[];
  children: (activeTab: string) => React.ReactNode;
}

export function AppDetailPanel({ title, subtitle, tabs, children }: AppDetailPanelProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">{subtitle}</p>
        )}
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-selected={activeTab === tab}
            className={`pb-3 text-sm transition-colors border-b-2 ${
              activeTab === tab
                ? 'font-medium text-primary dark:text-primary-light border-primary dark:border-primary-light'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>{children(activeTab)}</div>
    </div>
  );
}
