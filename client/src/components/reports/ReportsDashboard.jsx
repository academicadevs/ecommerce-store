import { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ReportCard from './ReportCard';
import StatusPieChart from './charts/StatusPieChart';
import RequestVolumeChart from './charts/OrderVolumeChart';

export default function ReportsDashboard({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [volumeData, setVolumeData] = useState([]);

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

      const [dashboardRes, volumeRes] = await Promise.all([
        reportsAPI.getDashboard(params),
        reportsAPI.getOrderVolume(params, 'day')
      ]);

      setDashboardData(dashboardRes.data);
      setVolumeData(volumeRes.data.volumeData || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {};

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard
          title="Total Requests"
          value={kpis.totalRequests || 0}
          change={kpis.totalRequestsChange}
          subtitle="vs previous period"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="blue"
        />

        <ReportCard
          title="Completed"
          value={kpis.completedRequests || 0}
          subtitle="requests finished"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
          color="green"
        />

        <ReportCard
          title="In Progress"
          value={kpis.inProgressRequests || 0}
          subtitle="being worked on"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="purple"
        />

        <ReportCard
          title="New Users"
          value={kpis.newUsers || 0}
          change={kpis.newUsersChange}
          subtitle="vs previous period"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
          color="orange"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-600">{kpis.pendingRequests || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting action or feedback</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(kpis.completionRate || 0).toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(kpis.completionRate || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-2">Date Range</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-400">From</p>
              <p className="text-lg font-medium text-gray-900">
                {dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="text-gray-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-gray-400">To</p>
              <p className="text-lg font-medium text-gray-900">
                {dateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RequestVolumeChart data={volumeData} groupBy="day" />
        <StatusPieChart data={dashboardData?.statusDistribution || []} />
      </div>
    </div>
  );
}
