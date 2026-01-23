export default function ReportCard({ title, value, subtitle, change, icon, color = 'blue' }) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatValue(value)}</p>

          <div className="flex items-center gap-2 mt-2">
            {change !== undefined && change !== null && (
              <span className={`inline-flex items-center text-sm font-medium ${
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
              }`}>
                {isPositive && (
                  <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {isNegative && (
                  <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {Math.abs(change).toFixed(1)}%
              </span>
            )}
            {subtitle && (
              <span className="text-sm text-gray-500">{subtitle}</span>
            )}
          </div>
        </div>

        {icon && (
          <div className={`${colorClasses[color]} text-white p-3 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
