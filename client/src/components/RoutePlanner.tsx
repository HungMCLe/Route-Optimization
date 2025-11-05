import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Zap,
  DollarSign,
  Clock,
  Leaf,
  Shield,
  TrendingUp,
  Settings,
  Play,
  Download,
  Sparkles
} from 'lucide-react';
import { ApiService } from '../services/api.service';
import type { NetworkNode, Route } from '../types';

export const RoutePlanner: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [scenario, setScenario] = useState<
    'lowest_cost' | 'fastest' | 'greenest' | 'most_reliable' | 'custom'
  >('fastest');
  const [optimizedRoute, setOptimizedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const handleOptimize = async () => {
    if (!origin || !destination) {
      alert('Please select both origin and destination');
      return;
    }

    setLoading(true);
    try {
      let route: Route;

      if (scenario === 'custom') {
        // Use custom optimization with weights
        route = await ApiService.optimizeRoute(origin, destination);
      } else {
        // Use predefined scenario
        route = await ApiService.optimizeScenario(origin, destination, scenario);
      }

      setOptimizedRoute(route);
    } catch (error) {
      console.error('Optimization failed:', error);
      alert('Failed to optimize route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    {
      id: 'lowest_cost',
      name: 'Lowest Cost',
      icon: DollarSign,
      color: 'bg-green-500',
      description: 'Minimize transportation costs',
    },
    {
      id: 'fastest',
      name: 'Fastest',
      icon: Zap,
      color: 'bg-blue-500',
      description: 'Minimize transit time',
    },
    {
      id: 'greenest',
      name: 'Greenest',
      icon: Leaf,
      color: 'bg-green-600',
      description: 'Minimize carbon emissions',
    },
    {
      id: 'most_reliable',
      name: 'Most Reliable',
      icon: Shield,
      color: 'bg-purple-500',
      description: 'Maximize reliability',
    },
  ];

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Planning Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Input */}
        <div className="lg:col-span-1 space-y-6">
          {/* Origin & Destination */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary-500" />
              Route Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Origin
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 dark:text-white"
                >
                  <option value="">Select origin...</option>
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name} ({node.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Destination
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 dark:text-white"
                >
                  <option value="">Select destination...</option>
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name} ({node.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Optimization Scenarios */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary-500" />
              Optimization Goal
            </h3>

            <div className="space-y-3">
              {scenarios.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setScenario(s.id as any)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      scenario === s.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${s.color} bg-opacity-10 flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon
                          className={`w-5 h-5 ${s.color.replace('bg-', 'text-')}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {s.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Advanced Options
            </button>
          </div>

          {/* Optimize Button */}
          <button
            onClick={handleOptimize}
            disabled={loading || !origin || !destination}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Optimize Route</span>
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-2 space-y-6">
          {optimizedRoute ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">
                    {formatTime(optimizedRoute.totalTime)}
                  </p>
                  <p className="text-sm text-blue-100 mt-1">Transit Time</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">
                    ${optimizedRoute.totalCost.total.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-100 mt-1">Total Cost</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">
                    {optimizedRoute.totalCarbon.toFixed(1)}
                  </p>
                  <p className="text-sm text-purple-100 mt-1">kg CO₂</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">
                    {optimizedRoute.reliability.toFixed(2)}
                  </p>
                  <p className="text-sm text-orange-100 mt-1">Reliability</p>
                </div>
              </div>

              {/* Route Segments */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Route Segments
                  </h3>
                  <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {optimizedRoute.segments.map((segment, index) => (
                    <div
                      key={segment.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {segment.from.name} → {segment.to.name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                via {segment.mode}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mt-4 ml-11">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Distance
                              </p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                                {segment.distance.toFixed(0)} km
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Time
                              </p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                                {formatTime(segment.estimatedTime)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Cost
                              </p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                                ${segment.cost.total.toFixed(0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Cost Breakdown
                </h3>

                <div className="space-y-3">
                  {Object.entries(optimizedRoute.totalCost)
                    .filter(([key, value]) => key !== 'currency' && key !== 'total' && value > 0)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                      >
                        <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          ${(value as number).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200 dark:border-slate-700">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      Total
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      ${optimizedRoute.totalCost.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Ready to Optimize
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Select origin, destination, and optimization goal, then click
                "Optimize Route"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
