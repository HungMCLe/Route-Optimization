import type {
  ApiResponse,
  NetworkNode,
  NetworkEdge,
  Route,
  RouteConstraints,
  OptimizationConfig,
  ParetoFrontier,
  Incident
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Network endpoints
  static async getNetwork(): Promise<{
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    stats: any;
  }> {
    const response = await this.request<{
      nodes: NetworkNode[];
      edges: NetworkEdge[];
      stats: any;
    }>('/network');
    return response.data!;
  }

  static async addNode(node: NetworkNode): Promise<{ node: NetworkNode }> {
    const response = await this.request<{ node: NetworkNode }>('/network/nodes', {
      method: 'POST',
      body: JSON.stringify(node),
    });
    return response.data!;
  }

  static async addEdge(edge: NetworkEdge): Promise<{ edge: NetworkEdge }> {
    const response = await this.request<{ edge: NetworkEdge }>('/network/edges', {
      method: 'POST',
      body: JSON.stringify(edge),
    });
    return response.data!;
  }

  static async removeNode(id: string): Promise<void> {
    await this.request(`/network/nodes/${id}`, {
      method: 'DELETE',
    });
  }

  static async removeEdge(id: string): Promise<void> {
    await this.request(`/network/edges/${id}`, {
      method: 'DELETE',
    });
  }

  // Route optimization endpoints
  static async optimizeRoute(
    origin: string,
    destination: string,
    constraints?: RouteConstraints,
    config?: OptimizationConfig
  ): Promise<Route> {
    const response = await this.request<Route>('/routes/optimize', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, constraints, config }),
    });
    return response.data!;
  }

  static async generateParetoFrontier(
    origin: string,
    destination: string,
    constraints?: RouteConstraints,
    objectives?: string[]
  ): Promise<ParetoFrontier> {
    const response = await this.request<ParetoFrontier>('/routes/pareto', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, constraints, objectives }),
    });
    return response.data!;
  }

  static async optimizeScenario(
    origin: string,
    destination: string,
    scenario: 'lowest_cost' | 'fastest' | 'greenest' | 'most_reliable'
  ): Promise<Route> {
    const response = await this.request<Route>('/routes/scenario', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, scenario }),
    });
    return response.data!;
  }

  static async reoptimizeRoute(
    route: Route,
    currentPosition: string,
    disruptedEdges: string[]
  ): Promise<Route> {
    const response = await this.request<Route>('/routes/reoptimize', {
      method: 'POST',
      body: JSON.stringify({ route, currentPosition, disruptedEdges }),
    });
    return response.data!;
  }

  // Real-time data endpoints
  static async getIncidents(): Promise<{ incidents: Incident[] }> {
    const response = await this.request<{ incidents: Incident[] }>('/incidents');
    return response.data!;
  }
}
