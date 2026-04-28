interface StatCard {
  label: string;
  value: string | number;
  change?: { value: string; trend: 'up' | 'down' | 'neutral' };
}

interface StatCardGridProps {
  stats: StatCard[];
  columns?: 2 | 3 | 4;
}

export function StatCardGrid({ stats, columns = 3 }: StatCardGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
        >
          <p className="text-xs text-gray-500 dark:text-gray-500">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-white">
            {stat.value}
          </p>
          {stat.change && (
            <p className={`mt-1 text-xs font-medium ${
              stat.change.trend === 'up' ? 'text-green-600 dark:text-green-400' :
              stat.change.trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-gray-500 dark:text-gray-500'
            }`}>
              {stat.change.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
