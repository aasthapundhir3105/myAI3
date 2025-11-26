"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

interface IngredientScore {
  ingredient: string;
  score: number;
  status: 'safe' | 'caution' | 'warning' | 'danger';
}

interface SafetyChartProps {
  data: {
    overall_score: number;
    ingredient_scores: IngredientScore[];
  };
}

// Color mapping based on safety score
const getColorByScore = (score: number) => {
  if (score >= 80) return '#10b981'; // Green - Safe
  if (score >= 60) return '#f59e0b'; // Yellow - Caution
  if (score >= 40) return '#f97316'; // Orange - Warning
  return '#ef4444'; // Red - Danger
};

const getStatusLabel = (score: number) => {
  if (score >= 80) return 'Safe';
  if (score >= 60) return 'Caution';
  if (score >= 40) return 'Warning';
  return 'Danger';
};

export function IngredientSafetyChart({ data }: SafetyChartProps) {
  const chartData = data.ingredient_scores.map(item => ({
    name: item.ingredient,
    score: item.score,
    status: getStatusLabel(item.score),
    fill: getColorByScore(item.score),
  }));

  const chartConfig = {
    score: {
      label: 'Safety Score',
    },
    safe: {
      label: 'Safe',
      color: '#10b981',
    },
    caution: {
      label: 'Caution', 
      color: '#f59e0b',
    },
    warning: {
      label: 'Warning',
      color: '#f97316',
    },
    danger: {
      label: 'Danger',
      color: '#ef4444',
    },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">
            Safety Score: <strong>{payload[0].value}/100</strong>
          </p>
          <p className="text-sm">
            Status: <strong>{payload[0].payload.status}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Ingredient Safety Analysis
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {data.overall_score}/100
          </div>
          <div className="text-sm text-gray-600">Overall Safety Score</div>
        </div>
      </div>

      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            layout="vertical" 
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              horizontal={true} 
              vertical={false} 
            />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tick={{ fill: '#6b7280' }}
              tickLine={{ stroke: '#6b7280' }}
            />
            <YAxis 
              type="category" 
              dataKey="name"
              tick={{ fill: '#6b7280' }}
              tickLine={{ stroke: '#6b7280' }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="score" 
              <Bar 
              radius={[0, 4, 4, 0]}
              barSize={20}
             >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Safe (80-100)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Caution (60-79)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Warning (40-59)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Danger (0-39)</span>
        </div>
      </div>
    </div>
  );
}
