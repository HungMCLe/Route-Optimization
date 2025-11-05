import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  DollarSign,
  Clock,
  Leaf,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  X,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiService } from '../services/api.service';
import type { Route, NetworkNode } from '../types';
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const ScenarioComparison: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [scenarios, setScenarios] = useState<{
    name: string;
    origin: string;
    destination: string;
    type: string;
    route: Route | null;
    loading: boolean;
  }[]>([]);
  const [compareView, setCompareView] = useState<'table' | 'chart' | 'radar'>('table');

  useEffect(() => {
    loadNetwork();
  }, []);

  const loadNetwork = async () => {
    try {
      const data = await ApiService.getNetwork();
      setNodes(data.nodes);
    } catch (error) {
      console.error('Failed to load network:', error);
    }
  };

  const addScenario = () => {
    setScenarios([
      ...scenarios,
      {
        name: `Scenario ${scenarios.length + 1}`,
        origin: '',
        destination: '',
        type: 'fastest',
        route: null,
        loading: false,
      },
    ]);
  };

  const removeScenario = (index: number) => {
    setScenarios(scenarios.filter((_, i) => i !== index));
  };

  const updateScenario = (index: number, updates: Partial<typeof scenarios[0]>) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = { ...newScenarios[index], ...updates };
    setScenarios(newScenarios);
  };

  const runScenario = async (index: number) => {
    const scenario = scenarios[index];
    if (!scenario.origin || !scenario.destination) {
      alert('Please select origin and destination');
      return;
    }

    updateScenario(index, { loading: true });

    try {
      const route = await ApiService.optimizeScenario(
        scenario.origin,
        scenario.destination,
        scenario.type as any
      );
      updateScenario(index, { route, loading: false });
    } catch (error) {
      console.error('Failed to optimize scenario:', error);
      updateScenario(index, { loading: false });
    }
  };

  const runAllScenarios = async () => {
    for (let i = 0; i < scenarios.length; i++) {
      await runScenario(i);
    }
  };

  const getComparisonData = () => {
    return scenarios
      .filter((s) => s.route)
      .map((s) => ({
        name: s.name,
        cost: s.route!.totalCost.total,
        time: s.route!.totalTime / 60, // Convert to hours
        carbon: s.route!.totalCarbon,
        reliability: s.route!.reliability * 100,
      }));
  };

  const getRadarData = () => {
    if (scenarios.filter((s) => s.route).length === 0) return [];

    const maxCost = Math.max(...scenarios.filter((s) => s.route).map((s) => s.route!.totalCost.total));
    const maxTime = Math.max(...scenarios.filter((s) => s.route).map((s) => s.route!.totalTime));
    const maxCarbon = Math.max(...scenarios.filter((s) => s.route).map((s) => s.route!.totalCarbon));

    const metrics = ['Cost', 'Time', 'Carbon', 'Reliability', 'Distance'];

    return metrics.map((metric) => {
      const data: any = { metric };

      scenarios.filter((s) => s.route).forEach((s) => {
        switch (metric) {
          case 'Cost':
            data[s.name] = (s.route!.totalCost.total / maxCost) * 100;
            break;
          case 'Time':
            data[s.name] = (s.route!.totalTime / maxTime) * 100;
            break;
          case 'Carbon':
            data[s.name] = (s.route!.totalCarbon / maxCarbon) * 100;
            break;
          case 'Reliability':
            data[s.name] = s.route!.reliability * 100;
            break;
          case 'Distance':
            data[s.name] = (s.route!.totalDistance / Math.max(...scenarios.filter((s) => s.route).map((s) => s.route!.totalDistance))) * 100;
            break;
        }
      });

      return data;
    });
  };

  const getDelta = (current: number, baseline: number) => {
    const delta = ((current - baseline) / baseline) * 100;
    return delta;
  };

  const exportComparison = () => {
    const data = scenarios.filter((s) => s.route).map((s) => ({
      name: s.name,
      origin: s.origin,
      destination: s.destination,
      type: s.type,
      totalCost: s.route!.totalCost.total,
      totalTime: s.route!.totalTime,
      totalCarbon: s.route!.totalCarbon,
      totalDistance: s.route!.totalDistance,
      reliability: s.route!.reliability,
      serviceLevel: s.route!.serviceLevel,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario-comparison-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <GitCompare className="w-7 h-7 mr-3 text-primary-500" />
            Scenario Comparison
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Compare multiple routing scenarios side-by-side
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={addScenario}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Scenario</span>
          </button>

          {scenarios.some((s) => s.route) && (
            <button
              onClick={exportComparison}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          )}

          <button
            onClick={runAllScenarios}
            disabled={scenarios.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>Run All</span>
          </button>
        </div>
      </div>

      {/* Scenario Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {scenarios.map((scenario, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={scenario.name}
                  onChange={(e) => updateScenario(index, { name: e.target.value })}
                  className="font-bold text-lg bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-primary-500 outline-none text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => removeScenario(index)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Origin
                  </label>
                  <select
                    value={scenario.origin}
                    onChange={(e) => updateScenario(index, { origin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">Select...</option>
                    {nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Destination
                  </label>
                  <select
                    value={scenario.destination}
                    onChange={(e) => updateScenario(index, { destination: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">Select...</option>
                    {nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Optimization Goal
                  </label>
                  <select
                    value={scenario.type}
                    onChange={(e) => updateScenario(index, { type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="lowest_cost">Lowest Cost</option>
                    <option value="fastest">Fastest</option>
                    <option value="greenest">Greenest</option>
                    <option value="most_reliable">Most Reliable</option>
                  </select>
                </div>

                <button
                  onClick={() => runScenario(index)}
                  disabled={scenario.loading || !scenario.origin || !scenario.destination}
                  className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {scenario.loading ? 'Running...' : 'Run Scenario'}
                </button>

                {scenario.route && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Cost:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ${scenario.route.totalCost.total.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Time:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {(scenario.route.totalTime / 60).toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">CO₂:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {scenario.route.totalCarbon.toFixed(1)}kg
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Comparison View */}
      {scenarios.some((s) => s.route) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Comparison Results
            </h3>

            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setCompareView('table')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  compareView === 'table'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setCompareView('chart')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  compareView === 'chart'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setCompareView('radar')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  compareView === 'radar'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Radar
              </button>
            </div>
          </div>

          {compareView === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      Scenario
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      Total Cost
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      Time
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      Carbon
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      Distance
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      Reliability
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.filter((s) => s.route).map((scenario, index) => {
                    const isBaseline = index === 0;
                    const baseline = scenarios[0].route;

                    return (
                      <tr
                        key={index}
                        className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {scenario.name}
                          </span>
                          {isBaseline && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                              Baseline
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              ${scenario.route!.totalCost.total.toFixed(0)}
                            </span>
                            {!isBaseline && baseline && (
                              <div className="flex items-center mt-1">
                                {getDelta(scenario.route!.totalCost.total, baseline.totalCost.total) < 0 ? (
                                  <>
                                    <TrendingDown className="w-3 h-3 text-green-500 mr-1" />
                                    <span className="text-xs text-green-600 dark:text-green-400">
                                      {Math.abs(getDelta(scenario.route!.totalCost.total, baseline.totalCost.total)).toFixed(1)}%
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <TrendingUp className="w-3 h-3 text-red-500 mr-1" />
                                    <span className="text-xs text-red-600 dark:text-red-400">
                                      +{getDelta(scenario.route!.totalCost.total, baseline.totalCost.total).toFixed(1)}%
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {(scenario.route!.totalTime / 60).toFixed(1)}h
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {scenario.route!.totalCarbon.toFixed(1)}kg
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {scenario.route!.totalDistance.toFixed(0)}km
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {(scenario.route!.reliability * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {compareView === 'chart' && (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getComparisonData()}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="cost" fill="#3b82f6" name="Cost ($)" />
                <Bar yAxisId="right" dataKey="carbon" fill="#10b981" name="Carbon (kg)" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {compareView === 'radar' && (
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={getRadarData()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                {scenarios.filter((s) => s.route).map((s, i) => (
                  <Radar
                    key={s.name}
                    name={s.name}
                    dataKey={s.name}
                    stroke={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i]}
                    fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i]}
                    fillOpacity={0.3}
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
};
