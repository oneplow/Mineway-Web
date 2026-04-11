"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function DashboardCharts({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-gray-500">
        No traffic data available.
      </div>
    );
  }

  // Calculate generic tick formats or just leave default
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#4b5563" 
            tick={{fill: '#9ca3af', fontSize: 12}}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#4b5563" 
            tick={{fill: '#9ca3af', fontSize: 12}}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1024 / 1024).toFixed(0)} MB`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
            itemStyle={{ color: '#f3f4f6' }}
            formatter={(value) => [`${(value / 1024 / 1024).toFixed(2)} MB`, ""]}
          />
          <Area 
            type="monotone" 
            dataKey="rx" 
            name="Download (RX)" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorRx)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="tx" 
            name="Upload (TX)" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorTx)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
