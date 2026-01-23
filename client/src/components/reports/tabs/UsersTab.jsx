import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { reportsAPI } from '../../../services/api';
import LoadingSpinner from '../../common/LoadingSpinner';
import TopSchoolsTable from '../charts/TopSchoolsTable';
import ExportButton from '../ExportButton';

const userTypeLabels = {
  school_staff: 'School Staff',
  academica_employee: 'Academica Employee',
  superadmin: 'Super Admin',
  admin: 'Admin'
};

const USER_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

export default function UsersTab({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState(null);
  const [schoolsData, setSchoolsData] = useState([]);

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

      const [usersRes, schoolsRes] = await Promise.all([
        reportsAPI.getUsersOverview(params),
        reportsAPI.getTopSchools(params, 10)
      ]);

      setUsersData(usersRes.data);
      setSchoolsData(schoolsRes.data.topSchools || []);
    } catch (error) {
      console.error('Failed to load user analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const schoolsExportColumns = [
    { key: 'schoolName', header: 'School Name' },
    { key: 'requestCount', header: 'Requests' },
    { key: 'uniqueUsers', header: 'Users' },
    { key: 'completedCount', header: 'Completed' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const userTypeData = usersData?.byType?.map(item => ({
    ...item,
    name: userTypeLabels[item.userType] || item.userType
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{usersData?.totalUsers || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Active Users (Period)</p>
          <p className="text-2xl font-bold text-gray-900">{usersData?.activeUsers || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Activity Rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {usersData?.totalUsers > 0
              ? `${((usersData.activeUsers / usersData.totalUsers) * 100).toFixed(1)}%`
              : '0%'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Schools</p>
          <p className="text-2xl font-bold text-gray-900">{schoolsData.length}</p>
        </div>
      </div>

      {/* Registration Trend and User Types */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Registration Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registration Trend</h3>
          {usersData?.registrationTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usersData.registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  formatter={(value) => [value, 'New Users']}
                  labelFormatter={formatDate}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No registration data for this period
            </div>
          )}
        </div>

        {/* Users by Type */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Type</h3>
          {userTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={USER_COLORS[index % USER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No user type data available
            </div>
          )}
        </div>
      </div>

      {/* Top Schools */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Schools by Requests</h3>
          <ExportButton
            data={schoolsData}
            columns={schoolsExportColumns}
            reportType="top-schools"
            title="Top Schools"
            dateRange={dateRange}
          />
        </div>
        <TopSchoolsTable data={schoolsData} />
      </div>
    </div>
  );
}
