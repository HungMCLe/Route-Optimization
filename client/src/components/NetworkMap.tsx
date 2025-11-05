import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Layers, Info, Navigation, Truck, Ship, Plane, TrainFront, Package, Warehouse } from 'lucide-react';
import { ApiService } from '../services/api.service';
import type { NetworkNode, NetworkEdge } from '../types';

// Fix Leaflet default marker icon issue with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icon creator for different node types
const createCustomIcon = (type: string, color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="color: white; font-weight: bold; font-size: 10px;">
          ${getNodeSymbol(type)}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const getNodeSymbol = (type: string): string => {
  const symbols: Record<string, string> = {
    hub: '⬢',
    port: '⚓',
    airport: '✈',
    warehouse: '📦',
    depot: '🏭',
    rail_terminal: '🚂',
    origin: '🟢',
    destination: '🔴',
    transfer_point: '⊕',
    customs: '🛃',
  };
  return symbols[type] || '●';
};

// Map view controller component
const MapViewController: React.FC<{ nodes: NetworkNode[] }> = ({ nodes }) => {
  const map = useMap();

  useEffect(() => {
    if (nodes.length > 0) {
      const bounds = L.latLngBounds(
        nodes.map(node => [node.coordinates.lat, node.coordinates.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [nodes, map]);

  return null;
};

export const NetworkMap: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadNetwork();
  }, []);

  const loadNetwork = async () => {
    try {
      const data = await ApiService.getNetwork();
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (error) {
      console.error('Failed to load network:', error);
    }
  };

  // Node colors by type
  const typeColors: Record<string, string> = {
    hub: '#3b82f6',
    port: '#06b6d4',
    airport: '#f59e0b',
    warehouse: '#8b5cf6',
    depot: '#10b981',
    rail_terminal: '#6366f1',
    origin: '#22c55e',
    destination: '#ef4444',
    transfer_point: '#94a3b8',
    customs: '#f59e0b',
  };

  // Edge colors by transport mode
  const modeColors: Record<string, string> = {
    road: '#3b82f6',
    rail: '#8b5cf6',
    sea: '#06b6d4',
    air: '#f59e0b',
    intermodal: '#6366f1',
  };

  // Filter nodes and edges
  const filteredNodes = nodes.filter(node => {
    if (filterType !== 'all' && node.type !== filterType) return false;
    return true;
  });

  const filteredEdges = edges.filter(edge => {
    if (!showEdges) return false;
    if (filterMode !== 'all' && edge.mode !== filterMode) return false;
    // Only show edges where both nodes are visible
    return filteredNodes.some(n => n.id === edge.source) &&
           filteredNodes.some(n => n.id === edge.target);
  });

  // Calculate center point
  const center: [number, number] = nodes.length > 0
    ? [
        nodes.reduce((sum, n) => sum + n.coordinates.lat, 0) / nodes.length,
        nodes.reduce((sum, n) => sum + n.coordinates.lng, 0) / nodes.length
      ]
    : [39.8283, -98.5795]; // Center of USA as default

  // Statistics
  const nodeTypeStats = filteredNodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modeStats = filteredEdges.reduce((acc, edge) => {
    acc[edge.mode] = (acc[edge.mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalDistance = filteredEdges.reduce((sum, edge) => sum + edge.distance, 0);
  const avgReliability = filteredEdges.length > 0
    ? filteredEdges.reduce((sum, edge) => sum + edge.reliability, 0) / filteredEdges.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <Navigation className="w-5 h-5 mr-2 text-primary-600" />
              Network Map
            </h3>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">
                Transport Mode:
              </label>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Modes</option>
                <option value="road">Road</option>
                <option value="rail">Rail</option>
                <option value="sea">Sea</option>
                <option value="air">Air</option>
                <option value="intermodal">Intermodal</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">
                Node Type:
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="hub">Hubs</option>
                <option value="port">Ports</option>
                <option value="airport">Airports</option>
                <option value="warehouse">Warehouses</option>
                <option value="depot">Depots</option>
                <option value="rail_terminal">Rail Terminals</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEdges}
                onChange={(e) => setShowEdges(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Show Routes
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Map and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <div style={{ height: '700px', width: '100%' }}>
            <MapContainer
              center={center}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Terrain">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              <MapViewController nodes={filteredNodes} />

              {/* Draw edges/routes */}
              {filteredEdges.map((edge) => {
                const source = nodes.find((n) => n.id === edge.source);
                const target = nodes.find((n) => n.id === edge.target);

                if (source && target) {
                  return (
                    <Polyline
                      key={edge.id}
                      positions={[
                        [source.coordinates.lat, source.coordinates.lng],
                        [target.coordinates.lat, target.coordinates.lng],
                      ]}
                      pathOptions={{
                        color: modeColors[edge.mode] || '#94a3b8',
                        weight: 3,
                        opacity: 0.6,
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-bold text-sm mb-2">
                            {source.name} → {target.name}
                          </h4>
                          <div className="space-y-1 text-xs">
                            <p><strong>Mode:</strong> {edge.mode}</p>
                            <p><strong>Distance:</strong> {edge.distance.toLocaleString()} km</p>
                            <p><strong>Time:</strong> {edge.baseTime} min</p>
                            <p><strong>Cost:</strong> ${edge.baseCost.toLocaleString()}</p>
                            <p><strong>Reliability:</strong> {(edge.reliability * 100).toFixed(1)}%</p>
                            <p><strong>Capacity:</strong> {edge.capacity.toLocaleString()} units</p>
                          </div>
                        </div>
                      </Popup>
                    </Polyline>
                  );
                }
                return null;
              })}

              {/* Draw nodes */}
              {filteredNodes.map((node) => (
                <Marker
                  key={node.id}
                  position={[node.coordinates.lat, node.coordinates.lng]}
                  icon={createCustomIcon(node.type, typeColors[node.type] || '#64748b')}
                  eventHandlers={{
                    click: () => setSelectedNode(node),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h4 className="font-bold text-sm mb-2">{node.name}</h4>
                      <div className="space-y-1 text-xs">
                        <p className="capitalize">
                          <strong>Type:</strong> {node.type.replace('_', ' ')}
                        </p>
                        {node.capacity && (
                          <p><strong>Capacity:</strong> {node.capacity.toLocaleString()} units</p>
                        )}
                        {node.dwellTime && (
                          <p><strong>Avg Dwell Time:</strong> {node.dwellTime} min</p>
                        )}
                        {node.operatingHours && (
                          <p>
                            <strong>Hours:</strong> {node.operatingHours.open} - {node.operatingHours.close}
                          </p>
                        )}
                        {node.facilities && node.facilities.length > 0 && (
                          <div className="mt-2">
                            <strong>Facilities:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {node.facilities.map((facility) => (
                                <span
                                  key={facility}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                                >
                                  {facility.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Legend */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Transport Modes</p>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-3 h-3 text-blue-500" />
                    <div className="w-3 h-0.5 bg-blue-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Road</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrainFront className="w-3 h-3 text-purple-500" />
                    <div className="w-3 h-0.5 bg-purple-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Rail</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Ship className="w-3 h-3 text-cyan-500" />
                    <div className="w-3 h-0.5 bg-cyan-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Sea</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Plane className="w-3 h-3 text-orange-500" />
                    <div className="w-3 h-0.5 bg-orange-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Air</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Node Types</p>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Hub</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Port</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Airport</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Warehouse</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Interactions</p>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <p>• Click markers for details</p>
                  <p>• Click routes for info</p>
                  <p>• Scroll to zoom</p>
                  <p>• Drag to pan</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-6">
          {/* Node Details */}
          {selectedNode ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {selectedNode.name}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                    {selectedNode.type.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Coordinates
                  </span>
                  <span className="text-xs font-mono text-slate-900 dark:text-white">
                    {selectedNode.coordinates.lat.toFixed(4)}, {selectedNode.coordinates.lng.toFixed(4)}
                  </span>
                </div>

                {selectedNode.capacity && (
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Capacity
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedNode.capacity.toLocaleString()} units
                    </span>
                  </div>
                )}

                {selectedNode.dwellTime && (
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Avg Dwell Time
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedNode.dwellTime} min
                    </span>
                  </div>
                )}

                {selectedNode.operatingHours && (
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Operating Hours
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedNode.operatingHours.open} - {selectedNode.operatingHours.close}
                    </span>
                  </div>
                )}

                {selectedNode.facilities && selectedNode.facilities.length > 0 && (
                  <div className="py-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Facilities
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.facilities.map((facility) => (
                        <span
                          key={facility}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-xs rounded-full text-slate-700 dark:text-slate-300"
                        >
                          {facility.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connected routes */}
                <div className="pt-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Connected Routes
                  </p>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} routes
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Info className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Click on a marker or route to view details
              </p>
            </div>
          )}

          {/* Network Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <Layers className="w-4 h-4 mr-2 text-primary-500" />
              Network Statistics
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Total Nodes
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {filteredNodes.length}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Total Routes
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {filteredEdges.length}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Total Distance
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {totalDistance.toLocaleString()} km
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Avg Reliability
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {(avgReliability * 100).toFixed(1)}%
                </span>
              </div>

              {Object.keys(nodeTypeStats).length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Node Types
                  </p>
                  {Object.entries(nodeTypeStats).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex justify-between py-1.5 text-xs"
                    >
                      <span className="text-slate-600 dark:text-slate-400 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {Object.keys(modeStats).length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Transport Modes
                  </p>
                  {Object.entries(modeStats).map(([mode, count]) => (
                    <div
                      key={mode}
                      className="flex justify-between py-1.5 text-xs"
                    >
                      <span className="text-slate-600 dark:text-slate-400 capitalize">
                        {mode}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
