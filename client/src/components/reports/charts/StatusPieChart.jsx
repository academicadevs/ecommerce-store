import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const statusLabels = {
  new: 'New Request',
  gathering_details: 'Gathering Details',
  design_phase: 'Design Phase',
  submitted_to_kimp360: 'Submitted to Kimp360',
  internal_review: 'Internal Review',
  waiting_feedback: 'Waiting for Feedback',
  waiting_signoff: 'Waiting for Sign Off',
  sent_to_print: 'Sent to Print / Third-Party',
  completed: 'Completed',
  on_hold: 'On Hold',
};

const statusColors = {
  new: '#3b82f6',
  gathering_details: '#0ea5e9',
  design_phase: '#8b5cf6',
  submitted_to_kimp360: '#6366f1',
  internal_review: '#7c3aed',
  waiting_feedback: '#f59e0b',
  waiting_signoff: '#06b6d4',
  sent_to_print: '#14b8a6',
  completed: '#10b981',
  on_hold: '#ef4444',
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null; // Don't show labels for small slices
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function StatusPieChart({ data }) {
  const chartData = data.map(item => ({
    ...item,
    name: statusLabels[item.status] || item.status,
    color: statusColors[item.status] || '#9ca3af'
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-medium">{data.count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => (
              <span className="text-sm text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
