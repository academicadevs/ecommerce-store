import { useState } from 'react';

export default function TopSchoolsTable({ data }) {
  const [sortBy, setSortBy] = useState('requestCount');

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'requestCount') return b.requestCount - a.requestCount;
    if (sortBy === 'completedCount') return b.completedCount - a.completedCount;
    return a.schoolName.localeCompare(b.schoolName);
  });

  const totalRequests = data.reduce((sum, s) => sum + s.requestCount, 0);
  const totalCompleted = data.reduce((sum, s) => sum + s.completedCount, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Schools</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="requestCount">Requests</option>
            <option value="completedCount">Completed</option>
            <option value="schoolName">Name</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                School
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requests
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Users
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completion Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((school, index) => {
              const completionRate = school.requestCount > 0
                ? (school.completedCount / school.requestCount) * 100
                : 0;
              return (
                <tr key={school.schoolName} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {school.schoolName}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-gray-900">{school.requestCount}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-500">{school.uniqueUsers}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm text-green-600 font-medium">{school.completedCount}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className={`text-sm font-medium ${
                      completionRate >= 80 ? 'text-green-600' :
                      completionRate >= 50 ? 'text-yellow-600' :
                      'text-gray-500'
                    }`}>
                      {completionRate.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-gray-200">
            <tr className="bg-gray-50">
              <td colSpan={2} className="px-4 py-3">
                <span className="text-sm font-medium text-gray-900">Total</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-gray-900">{totalRequests}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-gray-500">-</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-green-600">{totalCompleted}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-gray-500">
                  {totalRequests > 0 ? ((totalCompleted / totalRequests) * 100).toFixed(0) : 0}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No school data available for the selected period
        </div>
      )}
    </div>
  );
}
