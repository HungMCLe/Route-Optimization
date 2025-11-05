import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  DollarSign,
  Leaf,
  AlertTriangle,
  Activity,
  Truck,
  Ship,
  Plane,
  Train
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [networkStats, setNetworkStats] = useState<any>(null);

  // Mock data for visualizations
  const performanceData = [
    { month: 'Jan', cost: 12500, time: 285, carbon: 1200, routes: 45 },
    { month: 'Feb', cost: 11800, time: 270, carbon: 1100, routes: 52 },
    { month: 'Mar', cost: 10900, time: 255, carbon: 980, routes: 58 },
    { month: 'Apr', cost: 10200, time: 245, carbon: 920, routes: 61 },
    { month: 'May', cost: 9800, time: 240, carbon: 850, routes: 67 },
    { month: 'Jun', cost: 9500, time: 235, carbon: 820, routes: 72 },
  ];

  const modeDistribution = [
    { name: 'Road', value: 45, color: '#3b82f6' },
    { name: 'Rail', value: 25, color: '#8b5cf6' },
    { name: 'Sea', value: 20, color: '#06b6d4' },
    { name: 'Air', value: 10, color: '#f59e0b' },
  ];

  const recentRoutes = [
    {
      id: 'RT-1234',
      origin: 'Los Angeles Hub',
      destination: 'New York Hub',
      mode: 'road',
      status: 'completed',
      cost: 1850,
      time: 840,
      savings: 12,
    },
    {
      id: 'RT-1235',
      origin: 'Seattle Hub',
      destination: 'Chicago Hub',
      mode: 'rail',
      status: 'in_progress',
      cost: 2200,
      time: 1440,
      savings: 18,
    },
    {
      id: 'RT-1236',
      origin: 'Port of LA',
      destination: 'Port of NY',
      mode: 'sea',
      status: 'optimizing',
      cost: 3500,
      time: 14400,
      savings: 25,
    },
  ];

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change: number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, change, icon, color, subtitle }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
          <div className="flex items-center mt-4">
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm font-semibold ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-slate-500 ml-2">vs last month</span>
          </div>
        </div>
        <div
          className={`w-14 h-14 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}
        >
          <div className={`${color.replace('bg-', 'text-')}`}>{icon}</div>
        </div>
      </div>
    </div>
  );

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'road':
        return <Truck className="w-4 h-4" />;
      case 'rail':
        return <Train className="w-4 h-4" />;
      case 'sea':
        return <Ship className="w-4 h-4" />;
      case 'air':
        return <Plane className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'optimizing':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Routes Optimized"
          value="247"
          change={15}
          icon={<Package className="w-7 h-7" />}
          color="bg-primary-500"
          subtitle="This month"
        />
        <StatCard
          title="Average Cost Savings"
          value="$1,850"
          change={12}
          icon={<DollarSign className="w-7 h-7" />}
          color="bg-green-500"
          subtitle="Per route"
        />
        <StatCard
          title="Time Efficiency"
          value="94%"
          change={8}
          icon={<Clock className="w-7 h-7" />}
          color="bg-blue-500"
          subtitle="On-time delivery"
        />
        <StatCard
          title="CO₂ Reduction"
          value="18.2t"
          change={22}
          icon={<Leaf className="w-7 h-7" />}
          color="bg-green-500"
          subtitle="This month"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cost & Time Trends
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                6-month performance overview
              </p>
            </div>
            <Activity className="w-5 h-5 text-primary-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cost"
                stroke="#3b82f6"
                fill="url(#costGradient)"
                strokeWidth={2}
                name="Avg Cost ($)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="time"
                stroke="#8b5cf6"
                fill="url(#timeGradient)"
                strokeWidth={2}
                name="Avg Time (min)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mode Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Transport Mode Distribution
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Current network utilization
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-primary-500" />
          </div>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={modeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {modeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {modeDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Routes Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Optimizations
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Latest route calculations
            </p>
          </div>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium">
            View All Routes
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Route ID
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Origin → Destination
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mode
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Cost
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Savings
                </th>
              </tr>
            </thead>
            <tbody>
              {recentRoutes.map((route, index) => (
                <tr
                  key={route.id}
                  className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    index === recentRoutes.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {route.id}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {route.origin}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                        → {route.destination}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getModeIcon(route.mode)}
                      <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
                        {route.mode}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        route.status
                      )}`}
                    >
                      {route.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      ${route.cost.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {route.savings}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Network Health */}
      <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Network Health Status</h3>
            <p className="text-sm text-primary-100 mb-4">
              Real-time monitoring of network performance
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-sm text-primary-100">Active Nodes</p>
                <p className="text-2xl font-bold mt-1">12</p>
              </div>
              <div>
                <p className="text-sm text-primary-100">Active Edges</p>
                <p className="text-2xl font-bold mt-1">28</p>
              </div>
              <div>
                <p className="text-sm text-primary-100">Avg Reliability</p>
                <p className="text-2xl font-bold mt-1">92%</p>
              </div>
              <div>
                <p className="text-sm text-primary-100">Active Incidents</p>
                <p className="text-2xl font-bold mt-1">2</p>
              </div>
            </div>
          </div>
          <AlertTriangle className="w-12 h-12 text-primary-200" />
        </div>
      </div>
    </div>
  );
};
