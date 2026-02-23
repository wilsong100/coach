'use client';

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

export interface PacePoint {
  date: string;
  plannedPace?: number;
  actualPace?: number;
}

interface PaceChartProps {
  data: PacePoint[];
  className?: string;
}

const formatPace = (seconds?: number | null) => {
  if (!seconds || !Number.isFinite(seconds)) {
    return '—';
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${secs}`;
};

const formatDate = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function PaceChart({ data, className = '' }: PaceChartProps) {
  return (
    <div className={`h-[260px] w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="5 5" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickFormatter={formatDate} fontSize={12} tickMargin={6} />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={60}
            tickFormatter={(value) => formatPace(Number(value))}
            fontSize={12}
            tickMargin={6}
          />
          <Tooltip
            formatter={(value: number) => formatPace(Number(value))}
            labelFormatter={(label) => formatDate(label as string)}
          />
          <Legend align="right" verticalAlign="top" height={36} />
          <Line
            type="monotone"
            dataKey="plannedPace"
            name="Planned"
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="actualPace"
            name="Actual"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
