import type { NetworkNode, NetworkEdge, Route, RouteSegment, CostBreakdown, OptimizationConfig } from '../types/index.js';

/**
 * Core Graph Engine for route optimization
 * Supports multiple pathfinding algorithms and multi-modal transport
 */

export class GraphEngine {
  private nodes: Map<string, NetworkNode>;
  private edges: Map<string, NetworkEdge>;
  private adjacencyList: Map<string, string[]>; // nodeId -> [edgeIds]

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacencyList = new Map();
  }

  /**
   * Add a node to the graph
   */
  addNode(node: NetworkNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
    }
  }

  /**
   * Add an edge to the graph
   */
  addEdge(edge: NetworkEdge): void {
    this.edges.set(edge.id, edge);

    // Update adjacency list
    if (!this.adjacencyList.has(edge.source)) {
      this.adjacencyList.set(edge.source, []);
    }
    this.adjacencyList.get(edge.source)!.push(edge.id);
  }

  /**
   * Get neighbors of a node
   */
  getNeighbors(nodeId: string): Array<{ node: NetworkNode; edge: NetworkEdge }> {
    const edgeIds = this.adjacencyList.get(nodeId) || [];
    const neighbors: Array<{ node: NetworkNode; edge: NetworkEdge }> = [];

    for (const edgeId of edgeIds) {
      const edge = this.edges.get(edgeId);
      if (edge) {
        const targetNode = this.nodes.get(edge.target);
        if (targetNode) {
          neighbors.push({ node: targetNode, edge });
        }
      }
    }

    return neighbors;
  }

  /**
   * Calculate heuristic for A* (Euclidean distance)
   */
  private heuristic(nodeId: string, targetId: string): number {
    const node = this.nodes.get(nodeId);
    const target = this.nodes.get(targetId);

    if (!node || !target) return Infinity;

    const lat1 = node.coordinates.lat * Math.PI / 180;
    const lat2 = target.coordinates.lat * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLon = (target.coordinates.lng - node.coordinates.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const earthRadius = 6371; // km

    return earthRadius * c;
  }

  /**
   * Calculate edge cost based on optimization weights
   */
  private calculateEdgeCost(
    edge: NetworkEdge,
    config: OptimizationConfig
  ): number {
    const { weights } = config;

    let cost = 0;
    cost += edge.baseCost * weights.cost;
    cost += edge.baseTime * weights.time;
    cost += edge.carbonEmissions * edge.distance * weights.carbon;
    cost += (1 - edge.reliability) * 100 * weights.risk;

    return cost;
  }

  /**
   * A* pathfinding algorithm
   */
  findPathAStar(
    startId: string,
    goalId: string,
    config: OptimizationConfig
  ): string[] | null {
    const openSet = new Set<string>([startId]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(startId, 0);
    fScore.set(startId, this.heuristic(startId, goalId));

    while (openSet.size > 0) {
      // Find node with lowest fScore
      let current = '';
      let lowestF = Infinity;

      for (const nodeId of openSet) {
        const f = fScore.get(nodeId) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = nodeId;
        }
      }

      if (current === goalId) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.delete(current);

      const neighbors = this.getNeighbors(current);
      for (const { node, edge } of neighbors) {
        const tentativeGScore = (gScore.get(current) || Infinity) +
                                this.calculateEdgeCost(edge, config);

        if (tentativeGScore < (gScore.get(node.id) || Infinity)) {
          cameFrom.set(node.id, current);
          gScore.set(node.id, tentativeGScore);
          fScore.set(node.id, tentativeGScore + this.heuristic(node.id, goalId));

          if (!openSet.has(node.id)) {
            openSet.add(node.id);
          }
        }
      }
    }

    return null; // No path found
  }

  /**
   * Dijkstra's algorithm
   */
  findPathDijkstra(
    startId: string,
    goalId: string,
    config: OptimizationConfig
  ): string[] | null {
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const unvisited = new Set<string>();

    // Initialize
    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, Infinity);
      unvisited.add(nodeId);
    }
    distances.set(startId, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current = '';
      let minDist = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId) || Infinity;
        if (dist < minDist) {
          minDist = dist;
          current = nodeId;
        }
      }

      if (current === goalId) {
        return this.reconstructPath(previous, current);
      }

      if (minDist === Infinity) {
        break; // Remaining nodes are unreachable
      }

      unvisited.delete(current);

      const neighbors = this.getNeighbors(current);
      for (const { node, edge } of neighbors) {
        if (unvisited.has(node.id)) {
          const alt = (distances.get(current) || Infinity) +
                     this.calculateEdgeCost(edge, config);

          if (alt < (distances.get(node.id) || Infinity)) {
            distances.set(node.id, alt);
            previous.set(node.id, current);
          }
        }
      }
    }

    return null;
  }

  /**
   * Bidirectional search
   */
  findPathBidirectional(
    startId: string,
    goalId: string,
    config: OptimizationConfig
  ): string[] | null {
    const forwardVisited = new Map<string, string>();
    const backwardVisited = new Map<string, string>();
    const forwardQueue = [startId];
    const backwardQueue = [goalId];

    forwardVisited.set(startId, '');
    backwardVisited.set(goalId, '');

    while (forwardQueue.length > 0 || backwardQueue.length > 0) {
      // Forward search
      if (forwardQueue.length > 0) {
        const current = forwardQueue.shift()!;

        if (backwardVisited.has(current)) {
          return this.mergePaths(forwardVisited, backwardVisited, current);
        }

        const neighbors = this.getNeighbors(current);
        for (const { node } of neighbors) {
          if (!forwardVisited.has(node.id)) {
            forwardVisited.set(node.id, current);
            forwardQueue.push(node.id);
          }
        }
      }

      // Backward search
      if (backwardQueue.length > 0) {
        const current = backwardQueue.shift()!;

        if (forwardVisited.has(current)) {
          return this.mergePaths(forwardVisited, backwardVisited, current);
        }

        // Find edges leading to current node
        for (const edge of this.edges.values()) {
          if (edge.target === current && !backwardVisited.has(edge.source)) {
            backwardVisited.set(edge.source, current);
            backwardQueue.push(edge.source);
          }
        }
      }
    }

    return null;
  }

  /**
   * Reconstruct path from came-from map
   */
  private reconstructPath(cameFrom: Map<string, string>, current: string): string[] {
    const path = [current];

    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      path.unshift(current);
    }

    return path;
  }

  /**
   * Merge forward and backward paths
   */
  private mergePaths(
    forward: Map<string, string>,
    backward: Map<string, string>,
    meetingPoint: string
  ): string[] {
    const forwardPath = this.reconstructPath(forward, meetingPoint);
    const backwardPath: string[] = [];

    let current = meetingPoint;
    while (backward.has(current) && backward.get(current) !== '') {
      current = backward.get(current)!;
      backwardPath.push(current);
    }

    return [...forwardPath, ...backwardPath];
  }

  /**
   * Convert node path to route with segments
   */
  pathToRoute(
    nodePath: string[],
    config: OptimizationConfig,
    requestId: string
  ): Route {
    const segments: RouteSegment[] = [];
    let totalDistance = 0;
    let totalTime = 0;
    let totalCarbon = 0;
    const totalCost: CostBreakdown = {
      linehaul: 0,
      fuelSurcharge: 0,
      accessorials: 0,
      detention: 0,
      drayage: 0,
      tolls: 0,
      customs: 0,
      insurance: 0,
      total: 0,
      currency: 'USD'
    };

    for (let i = 0; i < nodePath.length - 1; i++) {
      const fromNode = this.nodes.get(nodePath[i])!;
      const toNode = this.nodes.get(nodePath[i + 1])!;

      // Find edge between these nodes
      const edgeIds = this.adjacencyList.get(nodePath[i]) || [];
      const edge = edgeIds
        .map(id => this.edges.get(id))
        .find(e => e && e.target === nodePath[i + 1]);

      if (!edge) continue;

      const segmentCost: CostBreakdown = {
        linehaul: edge.baseCost,
        fuelSurcharge: edge.fuelCost,
        accessorials: 0,
        detention: 0,
        drayage: 0,
        tolls: edge.tollCost || 0,
        customs: fromNode.customsRequired ? 150 : 0,
        insurance: edge.baseCost * 0.02,
        total: 0,
        currency: 'USD'
      };
      segmentCost.total = Object.values(segmentCost).reduce((a, b) =>
        typeof b === 'number' ? a + b : a, 0);

      const segment: RouteSegment = {
        id: `${requestId}-seg-${i}`,
        from: fromNode,
        to: toNode,
        edge,
        mode: edge.mode,
        distance: edge.distance,
        estimatedTime: edge.baseTime,
        cost: segmentCost,
        carbonEmissions: edge.carbonEmissions * edge.distance
      };

      segments.push(segment);
      totalDistance += edge.distance;
      totalTime += edge.baseTime;
      totalCarbon += segment.carbonEmissions;

      Object.keys(totalCost).forEach(key => {
        if (key !== 'currency' && typeof totalCost[key as keyof CostBreakdown] === 'number') {
          (totalCost[key as keyof CostBreakdown] as number) +=
            (segmentCost[key as keyof CostBreakdown] as number);
        }
      });
    }

    const route: Route = {
      id: requestId,
      segments,
      totalDistance,
      totalTime,
      totalCost,
      totalCarbon,
      serviceLevel: this.calculateServiceLevel(segments),
      reliability: this.calculateReliability(segments),
      riskScore: this.calculateRiskScore(segments),
      constraints: {} // Will be populated by caller
    };

    return route;
  }

  /**
   * Calculate service level score
   */
  private calculateServiceLevel(segments: RouteSegment[]): number {
    if (segments.length === 0) return 0;

    const avgReliability = segments.reduce((sum, seg) =>
      sum + seg.edge.reliability, 0) / segments.length;

    return avgReliability * 100;
  }

  /**
   * Calculate overall reliability
   */
  private calculateReliability(segments: RouteSegment[]): number {
    if (segments.length === 0) return 0;

    // Multiply reliabilities (independent events)
    return segments.reduce((product, seg) =>
      product * seg.edge.reliability, 1);
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(segments: RouteSegment[]): number {
    if (segments.length === 0) return 0;

    const reliability = this.calculateReliability(segments);
    const riskScore = (1 - reliability) * 100;

    return Math.min(100, riskScore);
  }

  /**
   * Get all nodes
   */
  getNodes(): NetworkNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges
   */
  getEdges(): NetworkEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Get node by ID
   */
  getNode(id: string): NetworkNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get edge by ID
   */
  getEdge(id: string): NetworkEdge | undefined {
    return this.edges.get(id);
  }

  /**
   * Remove node
   */
  removeNode(id: string): void {
    this.nodes.delete(id);
    this.adjacencyList.delete(id);

    // Remove edges connected to this node
    for (const [edgeId, edge] of this.edges.entries()) {
      if (edge.source === id || edge.target === id) {
        this.edges.delete(edgeId);
      }
    }
  }

  /**
   * Remove edge
   */
  removeEdge(id: string): void {
    const edge = this.edges.get(id);
    if (edge) {
      this.edges.delete(id);
      const edgeIds = this.adjacencyList.get(edge.source);
      if (edgeIds) {
        const index = edgeIds.indexOf(id);
        if (index > -1) {
          edgeIds.splice(index, 1);
        }
      }
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacencyList.clear();
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    nodeCount: number;
    edgeCount: number;
    avgDegree: number;
    modeDistribution: Record<string, number>;
  } {
    const modeDistribution: Record<string, number> = {};

    for (const edge of this.edges.values()) {
      modeDistribution[edge.mode] = (modeDistribution[edge.mode] || 0) + 1;
    }

    const totalDegree = Array.from(this.adjacencyList.values())
      .reduce((sum, edges) => sum + edges.length, 0);

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      avgDegree: this.nodes.size > 0 ? totalDegree / this.nodes.size : 0,
      modeDistribution
    };
  }
}
