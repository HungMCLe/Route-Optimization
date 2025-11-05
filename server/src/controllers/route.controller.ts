import type { Request, Response } from 'express';
import { GraphEngine } from '../algorithms/graph-engine.js';
import { OptimizationEngine } from '../algorithms/optimization-engine.js';
import { MockDataService } from '../services/mock-data.service.js';
import type {
  ShipmentRequest,
  OptimizationConfig,
  RouteConstraints,
  ApiResponse,
  Route,
  ParetoFrontier
} from '../types/index.js';

export class RouteController {
  private graphEngine: GraphEngine;
  private optimizationEngine: OptimizationEngine;
  private mockDataService: MockDataService;

  constructor() {
    this.graphEngine = new GraphEngine();
    this.optimizationEngine = new OptimizationEngine(this.graphEngine);
    this.mockDataService = MockDataService.getInstance();

    // Initialize with mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    const { nodes, edges } = this.mockDataService.generateSampleNetwork();

    nodes.forEach(node => this.graphEngine.addNode(node));
    edges.forEach(edge => this.graphEngine.addEdge(edge));
  }

  /**
   * GET /api/network - Get current network state
   */
  getNetwork = async (req: Request, res: Response) => {
    try {
      const nodes = this.graphEngine.getNodes();
      const edges = this.graphEngine.getEdges();
      const stats = this.graphEngine.getStats();

      const response: ApiResponse<{
        nodes: typeof nodes;
        edges: typeof edges;
        stats: typeof stats;
      }> = {
        success: true,
        data: { nodes, edges, stats },
        metadata: {
          timestamp: new Date(),
          requestId: `req-${Date.now()}`,
          processingTime: 0
        }
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * POST /api/routes/optimize - Find optimal route
   */
  optimizeRoute = async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      const { origin, destination, constraints, config } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Origin and destination are required'
          }
        });
      }

      const optimizationConfig: OptimizationConfig = config || {
        objectives: ['minimize_cost', 'minimize_time'],
        weights: { cost: 0.5, time: 0.5, carbon: 0, risk: 0, serviceLevel: 0 },
        algorithm: 'hybrid',
        considerTraffic: true,
        considerWeather: true,
        stochastic: false
      };

      const routeConstraints: RouteConstraints = constraints || {};

      const route = await this.optimizationEngine.findOptimalRoute(
        origin,
        destination,
        routeConstraints,
        optimizationConfig
      );

      if (!route) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_ROUTE_FOUND',
            message: 'No valid route found between origin and destination'
          }
        });
      }

      const response: ApiResponse<Route> = {
        success: true,
        data: route,
        metadata: {
          timestamp: new Date(),
          requestId: `req-${Date.now()}`,
          processingTime: Date.now() - startTime
        }
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * POST /api/routes/pareto - Generate Pareto frontier
   */
  generatePareto = async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      const { origin, destination, constraints, objectives } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Origin and destination are required'
          }
        });
      }

      const routeConstraints: RouteConstraints = constraints || {};
      const optimizationObjectives = objectives || [
        'minimize_cost',
        'minimize_time',
        'minimize_carbon'
      ];

      const paretoFrontier = await this.optimizationEngine.generateParetoFrontier(
        origin,
        destination,
        routeConstraints,
        optimizationObjectives
      );

      const response: ApiResponse<ParetoFrontier> = {
        success: true,
        data: paretoFrontier,
        metadata: {
          timestamp: new Date(),
          requestId: `req-${Date.now()}`,
          processingTime: Date.now() - startTime
        }
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * POST /api/routes/scenario - Optimize for specific scenario
   */
  optimizeScenario = async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      const { origin, destination, scenario } = req.body;

      if (!origin || !destination || !scenario) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Origin, destination, and scenario are required'
          }
        });
      }

      const validScenarios = ['lowest_cost', 'fastest', 'greenest', 'most_reliable'];
      if (!validScenarios.includes(scenario)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SCENARIO',
            message: `Scenario must be one of: ${validScenarios.join(', ')}`
          }
        });
      }

      const route = await this.optimizationEngine.optimizeForScenario(
        origin,
        destination,
        scenario
      );

      if (!route) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_ROUTE_FOUND',
            message: 'No valid route found for this scenario'
          }
        });
      }

      const response: ApiResponse<Route> = {
        success: true,
        data: route,
        metadata: {
          timestamp: new Date(),
          requestId: `req-${Date.now()}`,
          processingTime: Date.now() - startTime
        }
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * POST /api/routes/reoptimize - Re-optimize existing route
   */
  reoptimizeRoute = async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      const { route, currentPosition, disruptedEdges } = req.body;

      if (!route || !currentPosition || !disruptedEdges) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Route, current position, and disrupted edges are required'
          }
        });
      }

      const newRoute = await this.optimizationEngine.reoptimizeRoute(
        route,
        currentPosition,
        disruptedEdges
      );

      if (!newRoute) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_ROUTE_FOUND',
            message: 'No alternative route found'
          }
        });
      }

      const response: ApiResponse<Route> = {
        success: true,
        data: newRoute,
        metadata: {
          timestamp: new Date(),
          requestId: `req-${Date.now()}`,
          processingTime: Date.now() - startTime
        }
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * POST /api/network/nodes - Add new node
   */
  addNode = async (req: Request, res: Response) => {
    try {
      const node = req.body;

      if (!node.id || !node.name || !node.type || !node.coordinates) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Node must have id, name, type, and coordinates'
          }
        });
      }

      this.graphEngine.addNode(node);

      res.json({
        success: true,
        data: { node },
        metadata: {
          timestamp: new Date(),
          requestId: `req-${Date.now()}`,
          processingTime: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * POST /api/network/edges - Add new edge
   */
  addEdge = async (req: Request, res: Response) => {
    try {
      const edge = req.body;

      if (!edge.id || !edge.source || !edge.target || !edge.mode) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Edge must have id, source, target, and mode'
          }
        });
      }

      this.graphEngine.addEdge(edge);

      res.json({
        success: true,
        data: { edge },
        metadata: {
          timestamp: new Date(),
          requestId: `req-${Date.now()}`,
          processingTime: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * DELETE /api/network/nodes/:id - Remove node
   */
  removeNode = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      this.graphEngine.removeNode(id);

      res.json({
        success: true,
        data: { id },
        metadata: {
          timestamp: new Date(),
          requestId: `req-${Date.now()}`,
          processingTime: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * DELETE /api/network/edges/:id - Remove edge
   */
  removeEdge = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      this.graphEngine.removeEdge(id);

      res.json({
        success: true,
        data: { id },
        metadata: {
          timestamp: new Date(),
          requestId: `req-${Date.now()}`,
          processingTime: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * GET /api/incidents - Get random incidents
   */
  getIncidents = async (req: Request, res: Response) => {
    try {
      const edges = this.graphEngine.getEdges();
      const edgeIds = edges.map(e => e.id);
      const incidents = this.mockDataService.generateRandomIncidents(edgeIds, 5);

      res.json({
        success: true,
        data: { incidents },
        metadata: {
          timestamp: new Date(),
          requestId: `req-${Date.now()}`,
          processingTime: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };
}
