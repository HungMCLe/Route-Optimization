import type {
  Route,
  OptimizationConfig,
  OptimizationObjective,
  ParetoFrontier,
  ParetoPoint,
  RouteConstraints,
  RouteSegment
} from '../types/index.js';
import { GraphEngine } from './graph-engine.js';

/**
 * Multi-objective optimization engine
 * Generates Pareto frontier and handles constraint solving
 */

export class OptimizationEngine {
  private graphEngine: GraphEngine;

  constructor(graphEngine: GraphEngine) {
    this.graphEngine = graphEngine;
  }

  /**
   * Find optimal route considering all constraints
   */
  async findOptimalRoute(
    startId: string,
    goalId: string,
    constraints: RouteConstraints,
    config: OptimizationConfig
  ): Promise<Route | null> {
    const startTime = Date.now();

    // Select algorithm based on config
    let nodePath: string[] | null = null;

    switch (config.algorithm) {
      case 'astar':
        nodePath = this.graphEngine.findPathAStar(startId, goalId, config);
        break;
      case 'dijkstra':
        nodePath = this.graphEngine.findPathDijkstra(startId, goalId, config);
        break;
      case 'bidirectional':
        nodePath = this.graphEngine.findPathBidirectional(startId, goalId, config);
        break;
      case 'hybrid':
        // Try A* first, fallback to Dijkstra
        nodePath = this.graphEngine.findPathAStar(startId, goalId, config);
        if (!nodePath) {
          nodePath = this.graphEngine.findPathDijkstra(startId, goalId, config);
        }
        break;
      default:
        nodePath = this.graphEngine.findPathAStar(startId, goalId, config);
    }

    if (!nodePath) return null;

    const route = this.graphEngine.pathToRoute(
      nodePath,
      config,
      `route-${Date.now()}`
    );

    // Apply constraints
    route.constraints = constraints;

    // Validate constraints
    const isValid = this.validateConstraints(route, constraints);
    if (!isValid) {
      // Try to find alternative route
      return this.findAlternativeRoute(startId, goalId, constraints, config);
    }

    // Add metadata
    route.metadata = {
      algorithm: config.algorithm,
      computeTime: Date.now() - startTime,
      alternativesConsidered: 1
    };

    // Calculate confidence intervals if stochastic
    if (config.stochastic) {
      route.confidence = this.calculateConfidenceIntervals(route, config.confidenceLevel || 0.95);
    }

    return route;
  }

  /**
   * Generate Pareto frontier for multi-objective optimization
   */
  async generateParetoFrontier(
    startId: string,
    goalId: string,
    constraints: RouteConstraints,
    objectives: OptimizationObjective[]
  ): Promise<ParetoFrontier> {
    const startTime = Date.now();
    const candidateRoutes: Route[] = [];

    // Generate routes with different weight combinations
    const weightCombinations = this.generateWeightCombinations(objectives);

    for (const weights of weightCombinations) {
      const config: OptimizationConfig = {
        objectives,
        weights,
        algorithm: 'hybrid',
        considerTraffic: true,
        considerWeather: true,
        stochastic: false
      };

      const route = await this.findOptimalRoute(startId, goalId, constraints, config);
      if (route) {
        candidateRoutes.push(route);
      }
    }

    // Find Pareto optimal points
    const paretoPoints = this.findParetoOptimal(candidateRoutes);

    return {
      points: paretoPoints,
      metadata: {
        totalPointsEvaluated: candidateRoutes.length,
        computeTime: Date.now() - startTime,
        algorithm: 'weighted_sum_with_pareto_filtering'
      }
    };
  }

  /**
   * Generate weight combinations for multi-objective optimization
   */
  private generateWeightCombinations(objectives: OptimizationObjective[]): Array<{
    cost: number;
    time: number;
    carbon: number;
    risk: number;
    serviceLevel: number;
  }> {
    const combinations = [];
    const steps = 5; // Number of steps for each objective

    // Generate grid of weights
    for (let i = 0; i <= steps; i++) {
      for (let j = 0; j <= steps; j++) {
        for (let k = 0; k <= steps - i - j; k++) {
          const costWeight = i / steps;
          const timeWeight = j / steps;
          const carbonWeight = k / steps;
          const remaining = 1 - costWeight - timeWeight - carbonWeight;

          combinations.push({
            cost: costWeight,
            time: timeWeight,
            carbon: carbonWeight,
            risk: remaining * 0.5,
            serviceLevel: remaining * 0.5
          });
        }
      }
    }

    return combinations;
  }

  /**
   * Find Pareto optimal routes
   */
  private findParetoOptimal(routes: Route[]): ParetoPoint[] {
    const paretoPoints: ParetoPoint[] = [];

    for (const route of routes) {
      const objectives = {
        cost: route.totalCost.total,
        time: route.totalTime,
        carbon: route.totalCarbon,
        risk: route.riskScore
      };

      // Check if this route is dominated by any other route
      let isDominated = false;

      for (const otherRoute of routes) {
        if (route.id === otherRoute.id) continue;

        const otherObjectives = {
          cost: otherRoute.totalCost.total,
          time: otherRoute.totalTime,
          carbon: otherRoute.totalCarbon,
          risk: otherRoute.riskScore
        };

        // Check if otherRoute dominates this route
        const dominates =
          otherObjectives.cost <= objectives.cost &&
          otherObjectives.time <= objectives.time &&
          otherObjectives.carbon <= objectives.carbon &&
          otherObjectives.risk <= objectives.risk &&
          (
            otherObjectives.cost < objectives.cost ||
            otherObjectives.time < objectives.time ||
            otherObjectives.carbon < objectives.carbon ||
            otherObjectives.risk < objectives.risk
          );

        if (dominates) {
          isDominated = true;
          break;
        }
      }

      paretoPoints.push({
        route,
        objectives,
        isOptimal: !isDominated
      });
    }

    return paretoPoints;
  }

  /**
   * Validate route against constraints
   */
  private validateConstraints(route: Route, constraints: RouteConstraints): boolean {
    // Time window validation
    if (constraints.timeWindows) {
      for (const tw of constraints.timeWindows) {
        if (tw.hardConstraint) {
          const start = new Date(tw.start);
          const end = new Date(tw.end);
          const routeDuration = route.totalTime * 60 * 1000; // Convert to ms

          if (routeDuration > end.getTime() - start.getTime()) {
            return false;
          }
        }
      }
    }

    // Capacity validation
    if (constraints.capacity) {
      // Check if route can handle the capacity
      // This is simplified - in reality, we'd check each segment
      const hasCapacity = route.segments.every(seg =>
        seg.edge.capacity >= (constraints.capacity?.maxWeight || 0)
      );
      if (!hasCapacity) return false;
    }

    // Emission constraints
    if (constraints.emissions) {
      if (route.totalCarbon > constraints.emissions.maxCO2) {
        if (constraints.emissions.preferLowEmission) {
          // Soft constraint - allow but penalize
          return true;
        }
        return false;
      }
    }

    // Avoid nodes constraint
    if (constraints.avoidNodes) {
      const usedNodes = new Set(route.segments.flatMap(s => [s.from.id, s.to.id]));
      for (const avoidNode of constraints.avoidNodes) {
        if (usedNodes.has(avoidNode)) {
          return false;
        }
      }
    }

    // Required nodes constraint
    if (constraints.requiredNodes) {
      const usedNodes = new Set(route.segments.flatMap(s => [s.from.id, s.to.id]));
      for (const requiredNode of constraints.requiredNodes) {
        if (!usedNodes.has(requiredNode)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Find alternative route when constraints are violated
   */
  private async findAlternativeRoute(
    startId: string,
    goalId: string,
    constraints: RouteConstraints,
    config: OptimizationConfig
  ): Promise<Route | null> {
    // Try with relaxed weights
    const relaxedConfig: OptimizationConfig = {
      ...config,
      weights: {
        cost: config.weights.cost * 0.8,
        time: config.weights.time * 1.2,
        carbon: config.weights.carbon * 0.9,
        risk: config.weights.risk * 1.1,
        serviceLevel: config.weights.serviceLevel
      }
    };

    const nodePath = this.graphEngine.findPathDijkstra(startId, goalId, relaxedConfig);
    if (!nodePath) return null;

    const route = this.graphEngine.pathToRoute(
      nodePath,
      relaxedConfig,
      `route-alt-${Date.now()}`
    );

    route.constraints = constraints;

    return route;
  }

  /**
   * Calculate confidence intervals for stochastic routing
   */
  private calculateConfidenceIntervals(
    route: Route,
    confidenceLevel: number
  ): {
    timeMin: number;
    timeMax: number;
    costMin: number;
    costMax: number;
  } {
    // Use normal distribution approximation
    const zScore = this.getZScore(confidenceLevel);

    // Estimate variance based on route reliability
    const timeVariance = route.totalTime * (1 - route.reliability) * 0.3;
    const costVariance = route.totalCost.total * (1 - route.reliability) * 0.2;

    return {
      timeMin: Math.max(0, route.totalTime - zScore * Math.sqrt(timeVariance)),
      timeMax: route.totalTime + zScore * Math.sqrt(timeVariance),
      costMin: Math.max(0, route.totalCost.total - zScore * Math.sqrt(costVariance)),
      costMax: route.totalCost.total + zScore * Math.sqrt(costVariance)
    };
  }

  /**
   * Get z-score for confidence level
   */
  private getZScore(confidenceLevel: number): number {
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };

    return zScores[confidenceLevel] || 1.96;
  }

  /**
   * Optimize for specific scenario
   */
  async optimizeForScenario(
    startId: string,
    goalId: string,
    scenario: 'lowest_cost' | 'fastest' | 'greenest' | 'most_reliable'
  ): Promise<Route | null> {
    const configs: Record<string, OptimizationConfig> = {
      lowest_cost: {
        objectives: ['minimize_cost'],
        weights: { cost: 1, time: 0, carbon: 0, risk: 0, serviceLevel: 0 },
        algorithm: 'dijkstra',
        considerTraffic: false,
        considerWeather: false,
        stochastic: false
      },
      fastest: {
        objectives: ['minimize_time'],
        weights: { cost: 0, time: 1, carbon: 0, risk: 0, serviceLevel: 0 },
        algorithm: 'astar',
        considerTraffic: true,
        considerWeather: true,
        stochastic: false
      },
      greenest: {
        objectives: ['minimize_carbon'],
        weights: { cost: 0, time: 0, carbon: 1, risk: 0, serviceLevel: 0 },
        algorithm: 'dijkstra',
        considerTraffic: false,
        considerWeather: false,
        stochastic: false
      },
      most_reliable: {
        objectives: ['minimize_risk', 'maximize_service_level'],
        weights: { cost: 0.1, time: 0.1, carbon: 0, risk: 0.5, serviceLevel: 0.3 },
        algorithm: 'hybrid',
        considerTraffic: true,
        considerWeather: true,
        stochastic: true,
        confidenceLevel: 0.95
      }
    };

    return this.findOptimalRoute(startId, goalId, {}, configs[scenario]);
  }

  /**
   * Re-optimize route based on real-time disruptions
   */
  async reoptimizeRoute(
    currentRoute: Route,
    currentPosition: string, // current node ID
    disruptedEdges: string[]
  ): Promise<Route | null> {
    // Remove disrupted edges temporarily
    const removedEdges = new Map<string, any>();

    for (const edgeId of disruptedEdges) {
      const edge = this.graphEngine.getEdge(edgeId);
      if (edge) {
        removedEdges.set(edgeId, edge);
        this.graphEngine.removeEdge(edgeId);
      }
    }

    // Find new route from current position to destination
    const destination = currentRoute.segments[currentRoute.segments.length - 1].to.id;

    const newRoute = await this.findOptimalRoute(
      currentPosition,
      destination,
      currentRoute.constraints,
      {
        objectives: ['minimize_time', 'minimize_cost'],
        weights: { cost: 0.4, time: 0.6, carbon: 0, risk: 0, serviceLevel: 0 },
        algorithm: 'hybrid',
        considerTraffic: true,
        considerWeather: true,
        stochastic: false
      }
    );

    // Restore removed edges
    for (const [edgeId, edge] of removedEdges) {
      this.graphEngine.addEdge(edge);
    }

    return newRoute;
  }
}
