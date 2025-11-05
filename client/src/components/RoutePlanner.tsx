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
  Sparkles,
  Plus,
  X,
  Save,
  FolderOpen,
  GitCompare,
  Route as RouteIcon,
  ChevronDown,
  ChevronUp,
  Calendar,
  Package,
  Truck,
  BarChart3
} from 'lucide-react';
import { ApiService } from '../services/api.service';
import type { NetworkNode, Route, RouteConstraints, OptimizationConfig } from '../types';

export const RoutePlanner: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [scenario, setScenario] = useState<
    'lowest_cost' | 'fastest' | 'greenest' | 'most_reliable' | 'custom'
  >('fastest');
  const [optimizedRoute, setOptimizedRoute] = useState<Route | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);

  // Advanced constraints
  const [timeWindow, setTimeWindow] = useState({ start: '', end: '', hardConstraint: true });
  const [maxWeight, setMaxWeight] = useState<number>(0);
  const [maxVolume, setMaxVolume] = useState<number>(0);
  const [maxCO2, setMaxCO2] = useState<number>(0);
  const [avoidNodes] = useState<string[]>([]);
  const [requiredNodes] = useState<string[]>([]);
  const [priorityTier, setPriorityTier] = useState<'standard' | 'express' | 'economy'>('standard');

  // Custom weights
  const [customWeights, setCustomWeights] = useState({
    cost: 0.25,
    time: 0.25,
    carbon: 0.25,
    risk: 0.25,
    serviceLevel: 0
  });

  useEffect(() => {
    loadNetwork();
    loadSavedRoutes();
  }, []);

  const loadNetwork = async () => {
    try {
      const data = await ApiService.getNetwork();
      setNodes(data.nodes);
    } catch (error) {
      console.error('Failed to load network:', error);
    }
  };

  const loadSavedRoutes = () => {
    const saved = localStorage.getItem('savedRoutes');
    if (saved) {
      setSavedRoutes(JSON.parse(saved));
    }
  };

  const buildConstraints = (): Partial<RouteConstraints> => {
    const builtConstraints: Partial<RouteConstraints> = {
      priorityTier,
      avoidNodes: avoidNodes.length > 0 ? avoidNodes : undefined,
      requiredNodes: requiredNodes.length > 0 ? requiredNodes : undefined,
    };

    if (timeWindow.start && timeWindow.end) {
      builtConstraints.timeWindows = [{
        start: timeWindow.start,
        end: timeWindow.end,
        hardConstraint: timeWindow.hardConstraint
      }];
    }

    if (maxWeight > 0 || maxVolume > 0) {
      builtConstraints.capacity = {
        maxWeight: maxWeight > 0 ? maxWeight : undefined,
        maxVolume: maxVolume > 0 ? maxVolume : undefined,
      };
    }

    if (maxCO2 > 0) {
      builtConstraints.emissions = {
        maxCO2,
        preferLowEmission: true,
      };
    }

    return builtConstraints;
  };

  const handleOptimize = async () => {
    if (!origin || !destination) {
      alert('Please select both origin and destination');
      return;
    }

    setLoading(true);
    try {
      const builtConstraints = buildConstraints();
      let route: Route;

      if (scenario === 'custom') {
        // Use custom optimization with weights
        const config = {
          weights: customWeights,
        };
        route = await ApiService.optimizeRoute(origin, destination, builtConstraints, config as OptimizationConfig);
      } else {
        // Use predefined scenario
        route = await ApiService.optimizeScenario(origin, destination, scenario);
      }

      setOptimizedRoute(route);

      // Generate alternative routes
      try {
        const alternatives = await Promise.all([
          ApiService.optimizeScenario(origin, destination, 'lowest_cost'),
          ApiService.optimizeScenario(origin, destination, 'fastest'),
          ApiService.optimizeScenario(origin, destination, 'greenest'),
        ]);
        setAlternativeRoutes(alternatives.filter(r => r.id !== route.id));
      } catch (error) {
        console.error('Failed to generate alternatives:', error);
      }
    } catch (error) {
      console.error('Optimization failed:', error);
      alert('Failed to optimize route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addWaypoint = () => {
    setWaypoints([...waypoints, '']);
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const updateWaypoint = (index: number, value: string) => {
    const updated = [...waypoints];
    updated[index] = value;
    setWaypoints(updated);
  };

  const handleSaveRoute = () => {
    if (!optimizedRoute) return;

    const routeWithName = {
      ...optimizedRoute,
      name: `Route ${origin} → ${destination}`,
      savedAt: new Date().toISOString(),
    };

    const updated = [...savedRoutes, routeWithName as Route];
    setSavedRoutes(updated);
    localStorage.setItem('savedRoutes', JSON.stringify(updated));
    alert('Route saved successfully!');
  };

  const handleLoadRoute = (route: Route) => {
    setOptimizedRoute(route);
    setShowSavedRoutes(false);
  };

  const handleDeleteSavedRoute = (routeId: string) => {
    const updated = savedRoutes.filter(r => r.id !== routeId);
    setSavedRoutes(updated);
    localStorage.setItem('savedRoutes', JSON.stringify(updated));
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (!optimizedRoute) return;

    if (format === 'json') {
      const dataStr = JSON.stringify(optimizedRoute, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `route-${optimizedRoute.id}.json`;
      link.click();
    } else {
      // CSV export
      const headers = ['Segment', 'From', 'To', 'Mode', 'Distance (km)', 'Time', 'Cost', 'CO2 (kg)'];
      const rows = optimizedRoute.segments.map((seg, idx) => [
        idx + 1,
        seg.from.name,
        seg.to.name,
        seg.mode,
        seg.distance.toFixed(2),
        formatTime(seg.estimatedTime),
        seg.cost.total.toFixed(2),
        seg.carbonEmissions.toFixed(2),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const dataBlob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `route-${optimizedRoute.id}.csv`;
      link.click();
    }
  };

  const toggleRouteSelection = (routeId: string) => {
    setSelectedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
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
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleOptimize}
            disabled={loading || !origin || !destination}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
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

          {optimizedRoute && (
            <>
              <button
                onClick={handleSaveRoute}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>Save</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSavedRoutes(!showSavedRoutes)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center space-x-2"
                >
                  <FolderOpen className="w-5 h-5" />
                  <span>Load</span>
                </button>
              </div>

              <div className="relative group">
                <button
                  className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Export</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="hidden group-hover:block absolute top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-10">
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-lg"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {alternativeRoutes.length > 0 && (
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
          >
            <GitCompare className="w-5 h-5" />
            <span>Compare Routes</span>
          </button>
        )}
      </div>

      {/* Saved Routes Modal */}
      {showSavedRoutes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Saved Routes</h3>
              <button
                onClick={() => setShowSavedRoutes(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {savedRoutes.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-12">
                No saved routes yet
              </p>
            ) : (
              <div className="space-y-3">
                {savedRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {(route as any).name || `Route ${route.id}`}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {route.totalDistance.toFixed(0)} km • {formatTime(route.totalTime)} • ${route.totalCost.total.toFixed(0)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleLoadRoute(route)}
                          className="px-3 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteSavedRoute(route.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

              {/* Waypoints */}
              {waypoints.map((waypoint, index) => (
                <div key={index} className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Waypoint {index + 1}
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={waypoint}
                      onChange={(e) => updateWaypoint(index, e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 dark:text-white"
                    >
                      <option value="">Select waypoint...</option>
                      {nodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.name} ({node.type})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeWaypoint(index)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addWaypoint}
                className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Waypoint</span>
              </button>

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
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              {showAdvanced ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </button>
          </div>

          {/* Advanced Options Panel */}
          {showAdvanced && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2 text-primary-500" />
                Advanced Constraints
              </h3>

              {/* Time Window */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  Time Window
                </label>
                <div className="space-y-2">
                  <input
                    type="datetime-local"
                    value={timeWindow.start}
                    onChange={(e) => setTimeWindow({ ...timeWindow, start: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                    placeholder="Start time"
                  />
                  <input
                    type="datetime-local"
                    value={timeWindow.end}
                    onChange={(e) => setTimeWindow({ ...timeWindow, end: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                    placeholder="End time"
                  />
                  <label className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={timeWindow.hardConstraint}
                      onChange={(e) => setTimeWindow({ ...timeWindow, hardConstraint: e.target.checked })}
                      className="mr-2"
                    />
                    Hard constraint (must meet)
                  </label>
                </div>
              </div>

              {/* Capacity Constraints */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  <Package className="w-4 h-4 mr-2" />
                  Capacity Constraints
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Max Weight (kg)</label>
                    <input
                      type="number"
                      value={maxWeight || ''}
                      onChange={(e) => setMaxWeight(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Max Volume (m³)</label>
                    <input
                      type="number"
                      value={maxVolume || ''}
                      onChange={(e) => setMaxVolume(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Emission Constraints */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  <Leaf className="w-4 h-4 mr-2" />
                  Emission Limit
                </label>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">Max CO₂ (kg)</label>
                  <input
                    type="number"
                    value={maxCO2 || ''}
                    onChange={(e) => setMaxCO2(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Priority Tier */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  <Truck className="w-4 h-4 mr-2" />
                  Priority Tier
                </label>
                <select
                  value={priorityTier}
                  onChange={(e) => setPriorityTier(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  <option value="economy">Economy</option>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </select>
              </div>

              {/* Custom Weights (for custom scenario) */}
              {scenario === 'custom' && (
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Optimization Weights
                  </label>
                  <div className="space-y-3">
                    {Object.entries(customWeights).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs capitalize text-slate-600 dark:text-slate-400">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <span className="text-xs font-mono text-slate-900 dark:text-white">
                            {value.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={value}
                          onChange={(e) => setCustomWeights({
                            ...customWeights,
                            [key]: parseFloat(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

          {/* Alternative Routes */}
          {alternativeRoutes.length > 0 && !showComparison && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <RouteIcon className="w-5 h-5 mr-2 text-primary-500" />
                Alternative Routes
              </h3>

              <div className="space-y-3">
                {alternativeRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => setOptimizedRoute(route)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {route.id.includes('lowest_cost') && <DollarSign className="w-5 h-5 text-green-500" />}
                        {route.id.includes('fastest') && <Zap className="w-5 h-5 text-blue-500" />}
                        {route.id.includes('greenest') && <Leaf className="w-5 h-5 text-green-600" />}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Route #{route.id.slice(-4)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRouteSelection(route.id);
                        }}
                        className={`px-3 py-1 text-xs rounded ${
                          selectedRoutes.includes(route.id)
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {selectedRoutes.includes(route.id) ? 'Selected' : 'Select'}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Time</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatTime(route.totalTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Cost</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          ${route.totalCost.total.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">CO₂</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {route.totalCarbon.toFixed(1)} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Distance</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {route.totalDistance.toFixed(0)} km
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Route Comparison View */}
      {showComparison && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <GitCompare className="w-6 h-6 mr-2 text-primary-500" />
              Route Comparison
            </h3>
            <button
              onClick={() => setShowComparison(false)}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Metric
                  </th>
                  {optimizedRoute && (
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Primary Route
                    </th>
                  )}
                  {alternativeRoutes.slice(0, 3).map((route, idx) => (
                    <th key={route.id} className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Alternative {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                    Total Time
                  </td>
                  {optimizedRoute && (
                    <td className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {formatTime(optimizedRoute.totalTime)}
                    </td>
                  )}
                  {alternativeRoutes.slice(0, 3).map((route) => (
                    <td key={route.id} className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {formatTime(route.totalTime)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                    Total Cost
                  </td>
                  {optimizedRoute && (
                    <td className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      ${optimizedRoute.totalCost.total.toFixed(0)}
                    </td>
                  )}
                  {alternativeRoutes.slice(0, 3).map((route) => (
                    <td key={route.id} className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      ${route.totalCost.total.toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                    CO₂ Emissions
                  </td>
                  {optimizedRoute && (
                    <td className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {optimizedRoute.totalCarbon.toFixed(1)} kg
                    </td>
                  )}
                  {alternativeRoutes.slice(0, 3).map((route) => (
                    <td key={route.id} className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {route.totalCarbon.toFixed(1)} kg
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                    Distance
                  </td>
                  {optimizedRoute && (
                    <td className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {optimizedRoute.totalDistance.toFixed(0)} km
                    </td>
                  )}
                  {alternativeRoutes.slice(0, 3).map((route) => (
                    <td key={route.id} className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {route.totalDistance.toFixed(0)} km
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                    Reliability
                  </td>
                  {optimizedRoute && (
                    <td className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {optimizedRoute.reliability.toFixed(2)}
                    </td>
                  )}
                  {alternativeRoutes.slice(0, 3).map((route) => (
                    <td key={route.id} className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {route.reliability.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                    Segments
                  </td>
                  {optimizedRoute && (
                    <td className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {optimizedRoute.segments.length}
                    </td>
                  )}
                  {alternativeRoutes.slice(0, 3).map((route) => (
                    <td key={route.id} className="text-center py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {route.segments.length}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-center space-x-4">
            {alternativeRoutes.slice(0, 3).map((route, idx) => (
              <button
                key={route.id}
                onClick={() => {
                  setOptimizedRoute(route);
                  setShowComparison(false);
                }}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Select Alternative {idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visual Route Map Placeholder */}
      {optimizedRoute && !showComparison && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary-500" />
            Route Visualization
          </h3>

          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              {optimizedRoute.segments.map((segment, idx) => (
                <div key={segment.id} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                      {idx === 0 ? 'A' : idx === optimizedRoute.segments.length - 1 ? 'B' : idx + 1}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {segment.from.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {segment.mode}
                      </p>
                    </div>
                  </div>
                  {idx < optimizedRoute.segments.length - 1 && (
                    <div className="text-slate-400">→</div>
                  )}
                </div>
              ))}
              <div className="flex items-center space-x-2 mt-4">
                <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                  B
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {optimizedRoute.segments[optimizedRoute.segments.length - 1].to.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Destination
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
