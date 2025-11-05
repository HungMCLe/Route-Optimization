// ============================================================================
// Core Network Types
// ============================================================================

export type TransportMode = 'road' | 'rail' | 'sea' | 'air' | 'intermodal';

export type NodeType =
  | 'origin'
  | 'destination'
  | 'hub'
  | 'depot'
  | 'warehouse'
  | 'port'
  | 'airport'
  | 'rail_terminal'
  | 'customs'
  | 'transfer_point';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: NodeType;
  coordinates: Coordinates;
  capacity?: number;
  fixedCosts?: number;
  dwellTime?: number; // Average time spent at this node
  operatingHours?: {
    open: string;
    close: string;
  };
  facilities: string[]; // e.g., ['loading_dock', 'cold_storage', 'hazmat']
  restrictions?: string[]; // e.g., ['no_hazmat', 'weight_limit_40t']
  customsRequired?: boolean;
  metadata?: Record<string, any>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  mode: TransportMode;
  distance: number; // in km
  baseTime: number; // in minutes
  baseCost: number; // base cost per unit
  capacity: number;
  reliability: number; // 0-1 score
  carbonEmissions: number; // kg CO2 per km
  fuelCost: number;
  tollCost?: number;
  restrictions?: string[];
  speedLimit?: number;
  roadQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  metadata?: Record<string, any>;
}

// ============================================================================
// Constraint Types
// ============================================================================

export interface TimeWindow {
  start: Date | string;
  end: Date | string;
  hardConstraint: boolean; // true = must meet, false = soft preference
}

export interface CapacityConstraint {
  maxWeight?: number;
  maxVolume?: number;
  maxPallets?: number;
  specialRequirements?: string[]; // e.g., 'refrigerated', 'hazmat'
}

export interface FleetConstraint {
  vehicleType: string;
  count: number;
  capacity: CapacityConstraint;
  costPerKm: number;
  costPerHour: number;
  maxRange: number; // km
  maxDrivingTime: number; // hours per day
  requiredBreaks?: {
    afterHours: number;
    duration: number;
  };
}

export interface DriverRules {
  maxDrivingHours: number;
  maxShiftHours: number;
  requiredRestPeriod: number;
  maxConsecutiveDays: number;
}

export interface RegulatoryConstraint {
  cabotageRules?: string[];
  customsRequirements?: string[];
  embargoCountries?: string[];
  hazmatCorridors?: string[];
  axleLimits?: number;
}

export interface EmissionConstraint {
  maxCO2: number;
  preferLowEmission: boolean;
  emissionPenalty?: number; // cost per kg CO2
}

export interface RouteConstraints {
  timeWindows?: TimeWindow[];
  capacity?: CapacityConstraint;
  fleet?: FleetConstraint[];
  driverRules?: DriverRules;
  regulatory?: RegulatoryConstraint;
  emissions?: EmissionConstraint;
  avoidNodes?: string[];
  requiredNodes?: string[];
  priorityTier?: 'standard' | 'express' | 'economy';
}

// ============================================================================
// Optimization Types
// ============================================================================

export type OptimizationObjective =
  | 'minimize_cost'
  | 'minimize_time'
  | 'minimize_carbon'
  | 'minimize_risk'
  | 'maximize_service_level';

export interface OptimizationWeights {
  cost: number;
  time: number;
  carbon: number;
  risk: number;
  serviceLevel: number;
}

export interface OptimizationConfig {
  objectives: OptimizationObjective[];
  weights: OptimizationWeights;
  algorithm: 'astar' | 'dijkstra' | 'bidirectional' | 'contraction_hierarchies' | 'hybrid';
  considerTraffic: boolean;
  considerWeather: boolean;
  stochastic: boolean; // Use stochastic travel times
  confidenceLevel?: number; // For uncertainty bounds (e.g., 0.95)
}

// ============================================================================
// Route Types
// ============================================================================

export interface RouteSegment {
  id: string;
  from: NetworkNode;
  to: NetworkNode;
  edge: NetworkEdge;
  mode: TransportMode;
  distance: number;
  estimatedTime: number;
  cost: CostBreakdown;
  carrier?: string;
  departureTime?: Date;
  arrivalTime?: Date;
  carbonEmissions: number;
}

export interface CostBreakdown {
  linehaul: number;
  fuelSurcharge: number;
  accessorials: number; // loading, unloading fees
  detention: number; // waiting time costs
  drayage: number; // short-distance transport
  tolls: number;
  customs: number;
  insurance: number;
  total: number;
  currency: string;
}

export interface Route {
  id: string;
  segments: RouteSegment[];
  totalDistance: number;
  totalTime: number;
  totalCost: CostBreakdown;
  totalCarbon: number;
  serviceLevel: number; // 0-100 score
  reliability: number; // 0-1 confidence
  riskScore: number; // 0-100, higher = more risky
  confidence?: {
    timeMin: number;
    timeMax: number;
    costMin: number;
    costMax: number;
  };
  constraints: RouteConstraints;
  metadata?: {
    algorithm: string;
    computeTime: number;
    alternativesConsidered: number;
  };
}

// ============================================================================
// Real-time Data Types
// ============================================================================

export interface TrafficData {
  edgeId: string;
  congestionLevel: number; // 0-1
  speedFactor: number; // multiplier on base speed
  incidents: Incident[];
  timestamp: Date;
}

export interface Incident {
  id: string;
  type: 'accident' | 'construction' | 'weather' | 'closure' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: Coordinates;
  affectedEdges: string[];
  description: string;
  estimatedDuration: number; // minutes
  timestamp: Date;
}

export interface WeatherData {
  location: Coordinates;
  condition: 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
  temperature: number;
  windSpeed: number;
  visibility: number; // km
  impactOnTravel: number; // 0-1 delay factor
  timestamp: Date;
}

export interface TelemetryData {
  vehicleId: string;
  location: Coordinates;
  speed: number;
  heading: number;
  fuelLevel: number;
  timestamp: Date;
  status: 'in_transit' | 'loading' | 'unloading' | 'break' | 'idle';
}

// ============================================================================
// Scenario & Analysis Types
// ============================================================================

export interface Scenario {
  id: string;
  name: string;
  description: string;
  baselineRoute?: Route;
  modifications: ScenarioModification[];
  results?: ScenarioResults;
  createdAt: Date;
}

export interface ScenarioModification {
  type: 'add_node' | 'remove_node' | 'modify_edge' | 'change_constraint' | 'change_weights';
  target: string;
  value: any;
}

export interface ScenarioResults {
  route: Route;
  deltaVsBaseline: {
    cost: number;
    time: number;
    carbon: number;
    distance: number;
  };
  improvement: boolean;
}

export interface ParetoPoint {
  route: Route;
  objectives: {
    cost: number;
    time: number;
    carbon: number;
    risk: number;
  };
  isOptimal: boolean;
}

export interface ParetoFrontier {
  points: ParetoPoint[];
  metadata: {
    totalPointsEvaluated: number;
    computeTime: number;
    algorithm: string;
  };
}

// ============================================================================
// Planning & Dispatch Types
// ============================================================================

export interface ShipmentRequest {
  id: string;
  origin: string; // node ID
  destination: string; // node ID
  midpoints?: string[]; // required stops
  cargo: {
    weight: number;
    volume: number;
    type: string;
    specialHandling?: string[];
  };
  timeWindows: TimeWindow[];
  constraints: RouteConstraints;
  priority: 'low' | 'medium' | 'high' | 'critical';
  customerRef?: string;
}

export interface DispatchInstruction {
  id: string;
  shipmentId: string;
  route: Route;
  assignedVehicle?: string;
  assignedDriver?: string;
  loadingInstructions: string;
  specialInstructions?: string;
  documents: string[]; // URLs or IDs of required documents
  status: 'pending' | 'approved' | 'dispatched' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Analytics & Reporting Types
// ============================================================================

export interface PerformanceMetrics {
  period: {
    start: Date;
    end: Date;
  };
  totalShipments: number;
  onTimeDelivery: number; // percentage
  averageCost: number;
  totalCO2: number;
  averageTransitTime: number;
  utilizationRate: number;
  costSavings?: number; // vs baseline or previous period
  trends: {
    metric: string;
    change: number; // percentage change
    direction: 'up' | 'down' | 'stable';
  }[];
}

export interface NetworkHealth {
  timestamp: Date;
  activeNodes: number;
  activeEdges: number;
  incidents: number;
  averageCongestion: number;
  criticalIssues: string[];
  recommendations: string[];
}

// ============================================================================
// UI State Types
// ============================================================================

export interface MapViewState {
  center: Coordinates;
  zoom: number;
  selectedNodes: string[];
  selectedEdges: string[];
  highlightedRoute?: Route;
  showTraffic: boolean;
  showIncidents: boolean;
  showWeather: boolean;
  timeSliderValue?: Date;
}

export interface FilterState {
  modes: TransportMode[];
  nodeTypes: NodeType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  costRange?: {
    min: number;
    max: number;
  };
  showOnlyOptimal: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
