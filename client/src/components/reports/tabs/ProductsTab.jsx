import { useState, useEffect } from 'react';
import { reportsAPI } from '../../../services/api';
import LoadingSpinner from '../../common/LoadingSpinner';
import CategoryBarChart from '../charts/CategoryBarChart';
import TopProductsTable from '../charts/TopProductsTable';
import ExportButton from '../ExportButton';

export default function ProductsTab({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      };

      const [productsRes, categoryRes] = await Promise.all([
        reportsAPI.getTopProducts(params, 10),
        reportsAPI.getProductsByCategory(params)
      ]);

      setTopProducts(productsRes.data.topProducts || []);
      setCategoryData(categoryRes.data.byCategory || []);
    } catch (error) {
      console.error('Failed to load product analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const productExportColumns = [
    { key: 'name', header: 'Product Name' },
    { key: 'category', header: 'Category' },
    { key: 'requestCount', header: 'Requests' },
    { key: 'quantity', header: 'Quantity' }
  ];

  const categoryExportColumns = [
    { key: 'category', header: 'Category' },
    { key: 'requestCount', header: 'Requests' },
    { key: 'itemCount', header: 'Items Requested' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalRequests = topProducts.reduce((sum, p) => sum + (p.requestCount || 0), 0);
  const totalQuantity = topProducts.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Quantity</p>
          <p className="text-2xl font-bold text-gray-900">{totalQuantity}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold text-gray-900">{categoryData.length}</p>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Requests by Category</h3>
          <ExportButton
            data={categoryData}
            columns={categoryExportColumns}
            reportType="products-by-category"
            title="Products by Category"
            dateRange={dateRange}
          />
        </div>
        {categoryData.length > 0 ? (
          <CategoryBarChart data={categoryData} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No category data available for the selected period
          </div>
        )}
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Most Requested Products</h3>
          <ExportButton
            data={topProducts}
            columns={productExportColumns}
            reportType="top-products"
            title="Top Selling Products"
            dateRange={dateRange}
          />
        </div>
        <TopProductsTable data={topProducts} />
      </div>
    </div>
  );
}
