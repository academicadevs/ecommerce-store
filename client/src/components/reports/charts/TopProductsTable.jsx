import { useState } from 'react';

export default function TopProductsTable({ data }) {
  const [sortBy, setSortBy] = useState('requestCount');

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'requestCount') return b.requestCount - a.requestCount;
    if (sortBy === 'quantity') return b.quantity - a.quantity;
    return a.name.localeCompare(b.name);
  });

  const totalRequests = data.reduce((sum, p) => sum + p.requestCount, 0);
  const totalQuantity = data.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Most Requested Products</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="requestCount">Requests</option>
            <option value="quantity">Quantity</option>
            <option value="name">Name</option>
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
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requests
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty Ordered
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((product, index) => (
              <tr key={product.productId || index} className="hover:bg-gray-50">
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
                    {product.name}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-500">{product.category}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm font-medium text-gray-900">{product.requestCount}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-900">{product.quantity}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${totalRequests > 0 ? (product.requestCount / totalRequests) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {totalRequests > 0 ? ((product.requestCount / totalRequests) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-200">
            <tr className="bg-gray-50">
              <td colSpan={3} className="px-4 py-3">
                <span className="text-sm font-medium text-gray-900">Total</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-gray-900">{totalRequests}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-gray-900">{totalQuantity}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-gray-900">100%</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No product data available for the selected period
        </div>
      )}
    </div>
  );
}
