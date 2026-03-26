import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const RevenueTrendChart = ({ data = [] }) => {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
          contentStyle={{
            background: 'var(--tooltip-bg, #fff)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#8b5cf6"
          strokeWidth={2.5}
          dot={{ fill: '#8b5cf6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RevenueTrendChart;
