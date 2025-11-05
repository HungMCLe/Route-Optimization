import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  MapPin,
  ArrowRight,
  Download,
  Upload,
  Undo,
  Redo,
  Grid,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { NetworkNode, NetworkEdge, NodeType, TransportMode } from '../types';
import { ApiService } from '../services/api.service';

interface GraphEditorProps {
  initialNodes?: NetworkNode[];
  initialEdges?: NetworkEdge[];
  onSave?: (nodes: NetworkNode[], edges: NetworkEdge[]) => void;
}

export const GraphEditor: React.FC<GraphEditorProps> = ({
  initialNodes = [],
  initialEdges = [],
  onSave,
}) => {
  const [nodes, setNodes] = useState<NetworkNode[]>(initialNodes);
  const [edges, setEdges] = useState<NetworkEdge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [edgeStart, setEdgeStart] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<NetworkNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState<{ nodes: NetworkNode[]; edges: NetworkEdge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawGraph();
  }, [nodes, edges, zoom, pan, showGrid, selectedNode, selectedEdge]);

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      const gridSize = 50;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw edges
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        const start = projectNode(sourceNode);
        const end = projectNode(targetNode);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);

        const isSelected = selectedEdge?.id === edge.id;
        ctx.strokeStyle = isSelected ? '#3b82f6' : getModeColor(edge.mode);
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.globalAlpha = isSelected ? 1 : 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Draw arrow
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowLength = 15;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - arrowLength * Math.cos(angle - Math.PI / 6),
          end.y - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - arrowLength * Math.cos(angle + Math.PI / 6),
          end.y - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.strokeStyle = isSelected ? '#3b82f6' : getModeColor(edge.mode);
        ctx.stroke();

        // Draw label
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        ctx.font = '12px system-ui';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.fillText(`${edge.distance}km`, midX, midY - 5);
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const pos = projectNode(node);
      const isSelected = selectedNode?.id === node.id;
      const isDragged = draggedNode === node.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected || isDragged ? 12 : 10, 0, 2 * Math.PI);
      ctx.fillStyle = getNodeColor(node.type);
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#ffffff';
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.stroke();

      // Node label
      ctx.font = 'bold 13px system-ui';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, pos.x, pos.y + 25);

      // Node type
      ctx.font = '10px system-ui';
      ctx.fillStyle = '#64748b';
      ctx.fillText(node.type.replace('_', ' '), pos.x, pos.y + 38);
    });
  };

  const projectNode = (node: NetworkNode) => {
    // Simple projection for editor (you can enhance this)
    return {
      x: (node.coordinates.lng + 180) * 3 * zoom + pan.x,
      y: (90 - node.coordinates.lat) * 3 * zoom + pan.y,
    };
  };

  const getModeColor = (mode: TransportMode) => {
    const colors: Record<TransportMode, string> = {
      road: '#3b82f6',
      rail: '#8b5cf6',
      sea: '#06b6d4',
      air: '#f59e0b',
      intermodal: '#6366f1',
    };
    return colors[mode];
  };

  const getNodeColor = (type: NodeType) => {
    const colors: Record<NodeType, string> = {
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
    return colors[type] || '#64748b';
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a node
    const clickedNode = nodes.find((node) => {
      const pos = projectNode(node);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      return distance < 15;
    });

    if (clickedNode) {
      if (isAddingEdge) {
        if (!edgeStart) {
          setEdgeStart(clickedNode.id);
        } else if (edgeStart !== clickedNode.id) {
          // Create new edge
          const newEdge: NetworkEdge = {
            id: `edge-${Date.now()}`,
            source: edgeStart,
            target: clickedNode.id,
            mode: 'road',
            distance: 100,
            baseTime: 60,
            baseCost: 100,
            capacity: 10000,
            reliability: 0.9,
            carbonEmissions: 0.1,
            fuelCost: 50,
          };
          setEdges([...edges, newEdge]);
          setEdgeStart(null);
          setIsAddingEdge(false);
          saveToHistory();
        }
      } else {
        setSelectedNode(clickedNode);
        setSelectedEdge(null);
      }
    } else {
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  };

  const handleAddNode = () => {
    const newNode: NetworkNode = {
      id: `node-${Date.now()}`,
      name: 'New Node',
      type: 'hub',
      coordinates: { lat: 40, lng: -100 },
      capacity: 10000,
      facilities: [],
    };
    setNodes([...nodes, newNode]);
    setEditingNode(newNode);
    saveToHistory();
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setEdges(edges.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    saveToHistory();
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(edges.filter((e) => e.id !== edgeId));
    setSelectedEdge(null);
    saveToHistory();
  };

  const exportGraph = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network-graph.json';
    a.click();
  };

  const importGraph = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
          saveToHistory();
        }
      } catch (error) {
        console.error('Failed to import graph:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-full">
      {/* Toolbar */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">Tools</h3>

          <div className="space-y-2">
            <button
              onClick={handleAddNode}
              className="w-full flex items-center space-x-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Node</span>
            </button>

            <button
              onClick={() => {
                setIsAddingEdge(!isAddingEdge);
                setEdgeStart(null);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isAddingEdge
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-medium">Add Edge</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">View</h4>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400 flex-1 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Show Grid</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">Import/Export</h4>

          <div className="space-y-2">
            <button
              onClick={exportGraph}
              className="w-full flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export JSON</span>
            </button>

            <label className="w-full flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Import JSON</span>
              <input type="file" accept=".json" onChange={importGraph} className="hidden" />
            </label>
          </div>
        </div>

        {selectedNode && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
              Selected Node
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-slate-700 dark:text-slate-300">
                <span className="font-medium">Name:</span> {selectedNode.name}
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                <span className="font-medium">Type:</span> {selectedNode.type}
              </p>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => setEditingNode(selectedNode)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Edit className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1400}
          height={800}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair"
        />

        {isAddingEdge && edgeStart && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Click on a target node to create edge
          </div>
        )}
      </div>
    </div>
  );
};
