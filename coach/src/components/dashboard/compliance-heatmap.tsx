'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ComplianceDay {
  date: string;
  completionRate: number;
  total: number;
}

interface ComplianceHeatmapProps {
  data: ComplianceDay[];
  className?: string;
}

const colorForRate = (rate: number) => {
  if (rate >= 80) return '#16a34a';
  if (rate >= 60) return '#22c55e';
  if (rate >= 40) return '#84cc16';
  if (rate >= 20) return '#facc15';
  return '#fb923c';
};

const formatDate = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export function ComplianceHeatmap({ data, className = '' }: ComplianceHeatmapProps) {
  return (
    <div className={`h-[220px] w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 12, right: 12, left: 24, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            dataKey="date"
            type="category"
            tickFormatter={formatDate}
            width={80}
            axisLine={false}
            tickLine={false}
            fontSize={12}
          />
          <Tooltip formatter={(value: number) => `${value.toFixed(0)}%`} labelFormatter={formatDate} />
          <Bar dataKey="completionRate" barSize={16} radius={[4, 4, 4, 4]}>
            {data.map((entry) => (
              <Cell key={entry.date} fill={colorForRate(entry.completionRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
