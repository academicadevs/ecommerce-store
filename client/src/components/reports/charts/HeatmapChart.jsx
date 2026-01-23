const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 24 }, (_, i) => i);

function getColor(value, max) {
  if (value === 0) return 'bg-gray-100';
  const intensity = Math.min(value / max, 1);
  if (intensity < 0.25) return 'bg-blue-100';
  if (intensity < 0.5) return 'bg-blue-200';
  if (intensity < 0.75) return 'bg-blue-400';
  return 'bg-blue-600';
}

function getTextColor(value, max) {
  if (value === 0) return 'text-gray-400';
  const intensity = Math.min(value / max, 1);
  return intensity >= 0.75 ? 'text-white' : 'text-gray-700';
}

export default function HeatmapChart({ data }) {
  // Create a matrix of day x hour
  const matrix = {};
  let maxValue = 0;

  // Initialize matrix
  daysOfWeek.forEach((_, dayIndex) => {
    matrix[dayIndex] = {};
    hours.forEach(hour => {
      matrix[dayIndex][hour] = 0;
    });
  });

  // Fill in data
  data.forEach(item => {
    matrix[item.dayOfWeek][item.hour] = item.count;
    if (item.count > maxValue) maxValue = item.count;
  });

  const formatHour = (hour) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Activity Heatmap</h3>
      <p className="text-sm text-gray-500 mb-4">Orders by day of week and hour (Pacific Time)</p>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="w-16"></th>
              {hours.filter(h => h % 2 === 0).map(hour => (
                <th
                  key={hour}
                  className="px-1 py-1 text-xs text-gray-500 font-normal"
                  colSpan={2}
                >
                  {formatHour(hour)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.map((day, dayIndex) => (
              <tr key={day}>
                <td className="pr-2 py-1 text-sm text-gray-600 font-medium">{day}</td>
                {hours.map(hour => {
                  const value = matrix[dayIndex][hour];
                  return (
                    <td key={hour} className="p-0.5">
                      <div
                        className={`w-5 h-5 rounded ${getColor(value, maxValue)} ${getTextColor(value, maxValue)} flex items-center justify-center text-xs cursor-default`}
                        title={`${day} ${formatHour(hour)}: ${value} orders`}
                      >
                        {value > 0 ? value : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-4 justify-end">
        <span className="text-xs text-gray-500">Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-100"></div>
          <div className="w-4 h-4 rounded bg-blue-100"></div>
          <div className="w-4 h-4 rounded bg-blue-200"></div>
          <div className="w-4 h-4 rounded bg-blue-400"></div>
          <div className="w-4 h-4 rounded bg-blue-600"></div>
        </div>
        <span className="text-xs text-gray-500">More</span>
      </div>
    </div>
  );
}
