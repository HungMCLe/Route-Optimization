import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Maximize2, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { ApiService } from '../services/api.service';
import type { NetworkNode, NetworkEdge, Route } from '../types';

export const NetworkMap: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadNetwork();
  }, []);

  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      drawNetwork();
    }
  }, [nodes, edges, zoom, pan, showLabels, showEdges]);

  const loadNetwork = async () => {
    try {
      const data = await ApiService.getNetwork();
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (error) {
      console.error('Failed to load network:', error);
    }
  };

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate bounds for centering
    const lats = nodes.map((n) => n.coordinates.lat);
    const lngs = nodes.map((n) => n.coordinates.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;

    // Project coordinates to canvas
    const project = (lat: number, lng: number) => {
      const x =
        ((lng - minLng) / lngRange) * (canvas.width * 0.8) +
        canvas.width * 0.1 +
        pan.x;
      const y =
        ((maxLat - lat) / latRange) * (canvas.height * 0.8) +
        canvas.height * 0.1 +
        pan.y;
      return { x: x * zoom, y: y * zoom };
    };

    // Draw edges
    if (showEdges) {
      edges.forEach((edge) => {
        const source = nodes.find((n) => n.id === edge.source);
        const target = nodes.find((n) => n.id === edge.target);

        if (source && target) {
          const start = project(source.coordinates.lat, source.coordinates.lng);
          const end = project(target.coordinates.lat, target.coordinates.lng);

          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);

          // Color by mode
          const modeColors: Record<string, string> = {
            road: '#3b82f6',
            rail: '#8b5cf6',
            sea: '#06b6d4',
            air: '#f59e0b',
            intermodal: '#6366f1',
          };

          ctx.strokeStyle = modeColors[edge.mode] || '#94a3b8';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.4;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });
    }

    // Draw nodes
    nodes.forEach((node) => {
      const pos = project(node.coordinates.lat, node.coordinates.lng);

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

      const color = typeColors[node.type] || '#64748b';

      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw label
      if (showLabels) {
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, pos.x, pos.y + 20);
      }
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find((node) => {
      const lats = nodes.map((n) => n.coordinates.lat);
      const lngs = nodes.map((n) => n.coordinates.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const latRange = maxLat - minLat;
      const lngRange = maxLng - minLng;

      const nodeX =
        ((node.coordinates.lng - minLng) / lngRange) * (canvas.width * 0.8) +
        canvas.width * 0.1 +
        pan.x;
      const nodeY =
        ((maxLat - node.coordinates.lat) / latRange) * (canvas.height * 0.8) +
        canvas.height * 0.1 +
        pan.y;

      const distance = Math.sqrt(
        Math.pow((x - nodeX * zoom), 2) + Math.pow((y - nodeY * zoom), 2)
      );

      return distance < 12;
    });

    setSelectedNode(clickedNode || null);
  };

  const nodeTypeStats = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Network Visualization
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Reset View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Show Labels
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEdges}
                onChange={(e) => setShowEdges(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Show Connections
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Map and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-200 dark:border-slate-700">
          <canvas
            ref={canvasRef}
            width={1200}
            height={700}
            onClick={handleCanvasClick}
            className="w-full h-auto rounded-lg bg-slate-50 dark:bg-slate-900 cursor-crosshair"
          />

          {/* Legend */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Road
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Rail
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Sea
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Air
              </span>
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
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Click on a node to view details
              </p>
            </div>
          )}

          {/* Network Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <Layers className="w-4 h-4 mr-2 text-primary-500" />
              Network Stats
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Total Nodes
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {nodes.length}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Total Edges
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {edges.length}
                </span>
              </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
