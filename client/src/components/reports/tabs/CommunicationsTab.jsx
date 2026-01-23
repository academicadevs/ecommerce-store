import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { reportsAPI } from '../../../services/api';
import LoadingSpinner from '../../common/LoadingSpinner';
import ReportCard from '../ReportCard';

export default function CommunicationsTab({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

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

      const response = await reportsAPI.getCommunicationsOverview(params);
      setData(response.data);
    } catch (error) {
      console.error('Failed to load communications analytics:', error);
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

  const inboundCount = data?.messageCounts?.find(m => m.direction === 'inbound')?.count || 0;
  const outboundCount = data?.messageCounts?.find(m => m.direction === 'outbound')?.count || 0;
  const totalMessages = inboundCount + outboundCount;

  const messageChartData = [
    { name: 'Inbound', count: inboundCount, color: '#3b82f6' },
    { name: 'Outbound', count: outboundCount, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard
          title="Total Messages"
          value={totalMessages}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          color="blue"
        />
        <ReportCard
          title="Inbound Messages"
          value={inboundCount}
          subtitle="Customer replies"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
          color="blue"
        />
        <ReportCard
          title="Outbound Messages"
          value={outboundCount}
          subtitle="Admin sent"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
          color="green"
        />
        <ReportCard
          title="Proof Annotations"
          value={data?.annotationCount || 0}
          subtitle="Feedback items"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
          color="purple"
        />
      </div>

      {/* Proof Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Message Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={messageChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" width={80} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {messageChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Proof Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Proof Review Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Total Proofs</p>
                <p className="text-2xl font-bold text-gray-900">{data?.proofStats?.totalProofs || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Approved Proofs</p>
                <p className="text-2xl font-bold text-green-600">{data?.proofStats?.approvedProofs || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.proofStats?.approvalRate?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Most Active Orders */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Orders (by Communication)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Number</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Messages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.mostActiveOrders?.map((order, index) => (
                <tr key={order.orderId} className="hover:bg-gray-50">
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
                    <span className="font-mono text-sm text-gray-900">{order.orderNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-gray-900">{order.messageCount}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!data?.mostActiveOrders || data.mostActiveOrders.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No communication data for the selected period
          </div>
        )}
      </div>
    </div>
  );
}
