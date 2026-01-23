import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { reportsAPI } from '../../../services/api';
import LoadingSpinner from '../../common/LoadingSpinner';
import ExportButton from '../ExportButton';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function StaffTab({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState([]);

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

      const response = await reportsAPI.getStaffPerformance(params);
      setStaffData(response.data.staffPerformance || []);
    } catch (error) {
      console.error('Failed to load staff performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportColumns = [
    { key: 'adminName', header: 'Staff Name' },
    { key: 'adminEmail', header: 'Email' },
    { key: 'totalAssigned', header: 'Total Assigned' },
    { key: 'completed', header: 'Completed' },
    { key: 'inProgress', header: 'In Progress' },
    { key: 'newRequests', header: 'New' },
    { key: 'completionRate', header: 'Completion Rate (%)', format: 'percent' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalAssigned = staffData.reduce((sum, s) => sum + s.totalAssigned, 0);
  const totalCompleted = staffData.reduce((sum, s) => sum + s.completed, 0);
  const avgCompletionRate = staffData.length > 0
    ? staffData.reduce((sum, s) => sum + s.completionRate, 0) / staffData.length
    : 0;

  // Chart data for workload distribution
  const workloadChartData = staffData
    .filter(s => s.totalAssigned > 0)
    .map(s => ({
      name: s.adminName.split(' ')[0], // First name only for chart
      assigned: s.totalAssigned,
      completed: s.completed
    }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Requests Assigned</p>
          <p className="text-2xl font-bold text-gray-900">{totalAssigned}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Completed</p>
          <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Avg Completion Rate</p>
          <p className="text-2xl font-bold text-gray-900">{avgCompletionRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Workload Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workload Distribution</h3>
        {workloadChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workloadChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="assigned" name="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No workload data for this period
          </div>
        )}
      </div>

      {/* Staff Performance Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Staff Performance Details</h3>
          <ExportButton
            data={staffData}
            columns={exportColumns}
            reportType="staff-performance"
            title="Staff Performance Report"
            dateRange={dateRange}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Assigned</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">In Progress</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">New</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffData.map((staff, index) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium`}
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {staff.adminName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{staff.adminName}</p>
                        <p className="text-xs text-gray-500">{staff.adminEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {staff.totalAssigned}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-green-600 font-medium">
                    {staff.completed}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-blue-600">
                    {staff.inProgress}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-yellow-600">
                    {staff.newRequests}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            staff.completionRate >= 80 ? 'bg-green-500' :
                            staff.completionRate >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(staff.completionRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium w-12 text-right ${
                        staff.completionRate >= 80 ? 'text-green-600' :
                        staff.completionRate >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {staff.completionRate.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {staffData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No staff performance data for the selected period
          </div>
        )}
      </div>
    </div>
  );
}
