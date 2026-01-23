import { useState, useEffect } from 'react';
import { reportsAPI } from '../../../services/api';
import LoadingSpinner from '../../common/LoadingSpinner';
import OrderVolumeChart from '../charts/OrderVolumeChart';
import StatusPieChart from '../charts/StatusPieChart';
import HeatmapChart from '../charts/HeatmapChart';
import ExportButton from '../ExportButton';

export default function OrdersTab({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('day');
  const [volumeData, setVolumeData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [adminData, setAdminData] = useState({ byAdmin: [], unassignedCount: 0 });

  useEffect(() => {
    loadData();
  }, [dateRange, groupBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      };

      const [volumeRes, statusRes, heatmapRes, adminRes] = await Promise.all([
        reportsAPI.getOrderVolume(params, groupBy),
        reportsAPI.getOrderStatusDistribution(params),
        reportsAPI.getOrdersHeatmap(params),
        reportsAPI.getOrdersByAdmin(params)
      ]);

      setVolumeData(volumeRes.data.volumeData || []);
      setStatusData(statusRes.data.distribution || []);
      setHeatmapData(heatmapRes.data.heatmapData || []);
      setAdminData(adminRes.data);
    } catch (error) {
      console.error('Failed to load request analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportColumns = [
    { key: 'adminName', header: 'Admin Name' },
    { key: 'adminEmail', header: 'Email' },
    { key: 'requestCount', header: 'Assigned Requests' },
    { key: 'completedCount', header: 'Completed' },
    { key: 'inProgressCount', header: 'In Progress' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Volume Chart with Group By Selector */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Request Volume</h3>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
        <OrderVolumeChart data={volumeData} groupBy={groupBy} />
      </div>

      {/* Status Distribution and Heatmap */}
      <div className="grid lg:grid-cols-2 gap-6">
        <StatusPieChart data={statusData} />
        <HeatmapChart data={heatmapData} />
      </div>

      {/* Requests by Admin */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Requests by Admin</h3>
            {adminData.unassignedCount > 0 && (
              <p className="text-sm text-yellow-600">
                {adminData.unassignedCount} unassigned request(s)
              </p>
            )}
          </div>
          <ExportButton
            data={adminData.byAdmin}
            columns={exportColumns}
            reportType="requests-by-admin"
            title="Requests by Admin"
            dateRange={dateRange}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Assigned</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">In Progress</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminData.byAdmin.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{admin.adminName}</p>
                    <p className="text-xs text-gray-500">{admin.adminEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {admin.requestCount}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-green-600 font-medium">
                    {admin.completedCount}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-blue-600">
                    {admin.inProgressCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${
                      admin.requestCount > 0 && (admin.completedCount / admin.requestCount) >= 0.8
                        ? 'text-green-600'
                        : admin.requestCount > 0 && (admin.completedCount / admin.requestCount) >= 0.5
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                    }`}>
                      {admin.requestCount > 0
                        ? `${((admin.completedCount / admin.requestCount) * 100).toFixed(0)}%`
                        : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {adminData.byAdmin.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No admin data available for the selected period
          </div>
        )}
      </div>
    </div>
  );
}
