'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface VolumePoint {
  date: string;
  plannedVolume?: number;
  actualVolume?: number;
}

interface VolumeChartProps {
  data: VolumePoint[];
  className?: string;
}

const formatVolume = (value?: number) => {
  if (!value || !Number.isFinite(value)) {
    return '—';
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`; 
  }
  return `${Math.round(value)}`;
};

const formatDate = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function VolumeChart({ data, className = '' }: VolumeChartProps) {
  return (
    <div className={`h-[260px] w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="5 5" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickFormatter={formatDate} fontSize={12} tickMargin={6} />
          <YAxis tickFormatter={formatVolume} axisLine={false} tickLine={false} width={60} />
          <Tooltip
            formatter={(value: number) => `${Math.round(value)} units`}
            labelFormatter={formatDate}
          />
          <Legend align="right" verticalAlign="top" height={36} />
          <Bar dataKey="plannedVolume" name="Planned" fill="#c084fc" radius={[4, 4, 0, 0]} />
          <Bar dataKey="actualVolume" name="Actual" fill="#22d3ee" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
