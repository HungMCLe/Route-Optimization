import type { NetworkNode, NetworkEdge, TransportMode, NodeType } from '../types/index.js';

/**
 * Mock data generator for testing and development
 */

export class MockDataService {
  private static instance: MockDataService;

  private constructor() {}

  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  /**
   * Generate sample network for North America logistics
   */
  generateSampleNetwork(): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
    const nodes: NetworkNode[] = [
      // Major US Cities
      {
        id: 'ny-hub',
        name: 'New York Hub',
        type: 'hub',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        capacity: 100000,
        fixedCosts: 50000,
        dwellTime: 120,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['loading_dock', 'cold_storage', 'hazmat', 'customs'],
        customsRequired: true
      },
      {
        id: 'la-hub',
        name: 'Los Angeles Hub',
        type: 'hub',
        coordinates: { lat: 34.0522, lng: -118.2437 },
        capacity: 120000,
        fixedCosts: 55000,
        dwellTime: 100,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['loading_dock', 'cold_storage', 'container_yard'],
        customsRequired: false
      },
      {
        id: 'chicago-hub',
        name: 'Chicago Hub',
        type: 'hub',
        coordinates: { lat: 41.8781, lng: -87.6298 },
        capacity: 90000,
        fixedCosts: 45000,
        dwellTime: 90,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['loading_dock', 'rail_access', 'cold_storage'],
        customsRequired: false
      },
      {
        id: 'atlanta-hub',
        name: 'Atlanta Hub',
        type: 'hub',
        coordinates: { lat: 33.7490, lng: -84.3880 },
        capacity: 85000,
        fixedCosts: 42000,
        dwellTime: 85,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['loading_dock', 'sorting_facility'],
        customsRequired: false
      },
      {
        id: 'dallas-hub',
        name: 'Dallas Hub',
        type: 'hub',
        coordinates: { lat: 32.7767, lng: -96.7970 },
        capacity: 80000,
        fixedCosts: 40000,
        dwellTime: 80,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['loading_dock', 'cross_dock'],
        customsRequired: false
      },
      {
        id: 'seattle-hub',
        name: 'Seattle Hub',
        type: 'hub',
        coordinates: { lat: 47.6062, lng: -122.3321 },
        capacity: 70000,
        fixedCosts: 38000,
        dwellTime: 95,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['loading_dock', 'port_access'],
        customsRequired: false
      },
      // Ports
      {
        id: 'la-port',
        name: 'Port of Los Angeles',
        type: 'port',
        coordinates: { lat: 33.7392, lng: -118.2708 },
        capacity: 200000,
        fixedCosts: 25000,
        dwellTime: 240,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['container_terminal', 'customs', 'rail_access'],
        customsRequired: true
      },
      {
        id: 'ny-port',
        name: 'Port of New York',
        type: 'port',
        coordinates: { lat: 40.6679, lng: -74.0429 },
        capacity: 180000,
        fixedCosts: 28000,
        dwellTime: 260,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['container_terminal', 'customs', 'rail_access'],
        customsRequired: true
      },
      // Airports
      {
        id: 'jfk-airport',
        name: 'JFK Airport',
        type: 'airport',
        coordinates: { lat: 40.6413, lng: -73.7781 },
        capacity: 50000,
        fixedCosts: 35000,
        dwellTime: 180,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['air_cargo', 'customs', 'cold_storage'],
        customsRequired: true
      },
      {
        id: 'lax-airport',
        name: 'LAX Airport',
        type: 'airport',
        coordinates: { lat: 33.9416, lng: -118.4085 },
        capacity: 45000,
        fixedCosts: 33000,
        dwellTime: 170,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['air_cargo', 'customs'],
        customsRequired: true
      },
      // Warehouses
      {
        id: 'memphis-warehouse',
        name: 'Memphis Distribution Center',
        type: 'warehouse',
        coordinates: { lat: 35.1495, lng: -90.0490 },
        capacity: 60000,
        fixedCosts: 30000,
        dwellTime: 120,
        operatingHours: { open: '06:00', close: '22:00' },
        facilities: ['loading_dock', 'sorting_facility', 'cold_storage'],
        customsRequired: false
      },
      // Rail Terminals
      {
        id: 'chicago-rail',
        name: 'Chicago Rail Terminal',
        type: 'rail_terminal',
        coordinates: { lat: 41.8500, lng: -87.6500 },
        capacity: 100000,
        fixedCosts: 20000,
        dwellTime: 300,
        operatingHours: { open: '00:00', close: '23:59' },
        facilities: ['rail_yard', 'container_transfer'],
        customsRequired: false
      }
    ];

    const edges: NetworkEdge[] = [
      // Road connections
      {
        id: 'edge-ny-chicago-road',
        source: 'ny-hub',
        target: 'chicago-hub',
        mode: 'road',
        distance: 1270,
        baseTime: 840, // 14 hours
        baseCost: 1500,
        capacity: 25000,
        reliability: 0.92,
        carbonEmissions: 0.12,
        fuelCost: 300,
        tollCost: 85,
        speedLimit: 110,
        roadQuality: 'excellent'
      },
      {
        id: 'edge-chicago-ny-road',
        source: 'chicago-hub',
        target: 'ny-hub',
        mode: 'road',
        distance: 1270,
        baseTime: 840,
        baseCost: 1500,
        capacity: 25000,
        reliability: 0.92,
        carbonEmissions: 0.12,
        fuelCost: 300,
        tollCost: 85,
        speedLimit: 110,
        roadQuality: 'excellent'
      },
      {
        id: 'edge-la-dallas-road',
        source: 'la-hub',
        target: 'dallas-hub',
        mode: 'road',
        distance: 2250,
        baseTime: 1320, // 22 hours
        baseCost: 2200,
        capacity: 28000,
        reliability: 0.89,
        carbonEmissions: 0.11,
        fuelCost: 450,
        tollCost: 45,
        speedLimit: 120,
        roadQuality: 'excellent'
      },
      {
        id: 'edge-chicago-atlanta-road',
        source: 'chicago-hub',
        target: 'atlanta-hub',
        mode: 'road',
        distance: 1130,
        baseTime: 720,
        baseCost: 1300,
        capacity: 26000,
        reliability: 0.91,
        carbonEmissions: 0.12,
        fuelCost: 280,
        tollCost: 35,
        speedLimit: 110,
        roadQuality: 'good'
      },
      {
        id: 'edge-seattle-la-road',
        source: 'seattle-hub',
        target: 'la-hub',
        mode: 'road',
        distance: 1850,
        baseTime: 1080,
        baseCost: 1900,
        capacity: 24000,
        reliability: 0.88,
        carbonEmissions: 0.13,
        fuelCost: 400,
        tollCost: 25,
        speedLimit: 110,
        roadQuality: 'good'
      },
      // Rail connections
      {
        id: 'edge-la-chicago-rail',
        source: 'la-hub',
        target: 'chicago-rail',
        mode: 'rail',
        distance: 3300,
        baseTime: 2880, // 48 hours
        baseCost: 2500,
        capacity: 80000,
        reliability: 0.95,
        carbonEmissions: 0.04,
        fuelCost: 600,
        speedLimit: 90,
        roadQuality: 'excellent'
      },
      {
        id: 'edge-chicago-ny-rail',
        source: 'chicago-rail',
        target: 'ny-hub',
        mode: 'rail',
        distance: 1420,
        baseTime: 1440, // 24 hours
        baseCost: 1800,
        capacity: 75000,
        reliability: 0.94,
        carbonEmissions: 0.04,
        fuelCost: 350,
        speedLimit: 90,
        roadQuality: 'excellent'
      },
      // Sea connections
      {
        id: 'edge-laport-nyport-sea',
        source: 'la-port',
        target: 'ny-port',
        mode: 'sea',
        distance: 8300,
        baseTime: 14400, // 10 days
        baseCost: 3500,
        capacity: 500000,
        reliability: 0.87,
        carbonEmissions: 0.01,
        fuelCost: 1200,
        speedLimit: 35,
        roadQuality: 'good'
      },
      // Air connections
      {
        id: 'edge-lax-jfk-air',
        source: 'lax-airport',
        target: 'jfk-airport',
        mode: 'air',
        distance: 3970,
        baseTime: 330, // 5.5 hours
        baseCost: 8500,
        capacity: 15000,
        reliability: 0.93,
        carbonEmissions: 0.85,
        fuelCost: 2500,
        speedLimit: 850,
        roadQuality: 'excellent'
      },
      {
        id: 'edge-jfk-lax-air',
        source: 'jfk-airport',
        target: 'lax-airport',
        mode: 'air',
        distance: 3970,
        baseTime: 360, // 6 hours (headwinds)
        baseCost: 8700,
        capacity: 15000,
        reliability: 0.93,
        carbonEmissions: 0.85,
        fuelCost: 2600,
        speedLimit: 850,
        roadQuality: 'excellent'
      },
      // Intermodal connections
      {
        id: 'edge-laport-lahub-road',
        source: 'la-port',
        target: 'la-hub',
        mode: 'road',
        distance: 35,
        baseTime: 60,
        baseCost: 200,
        capacity: 30000,
        reliability: 0.96,
        carbonEmissions: 0.12,
        fuelCost: 25,
        speedLimit: 60,
        roadQuality: 'good'
      },
      {
        id: 'edge-nyport-nyhub-road',
        source: 'ny-port',
        target: 'ny-hub',
        mode: 'road',
        distance: 28,
        baseTime: 50,
        baseCost: 180,
        capacity: 32000,
        reliability: 0.95,
        carbonEmissions: 0.12,
        fuelCost: 22,
        speedLimit: 60,
        roadQuality: 'fair'
      },
      {
        id: 'edge-lax-lahub-road',
        source: 'lax-airport',
        target: 'la-hub',
        mode: 'road',
        distance: 30,
        baseTime: 55,
        baseCost: 150,
        capacity: 20000,
        reliability: 0.97,
        carbonEmissions: 0.11,
        fuelCost: 20,
        speedLimit: 70,
        roadQuality: 'excellent'
      },
      {
        id: 'edge-jfk-nyhub-road',
        source: 'jfk-airport',
        target: 'ny-hub',
        mode: 'road',
        distance: 26,
        baseTime: 45,
        baseCost: 140,
        capacity: 18000,
        reliability: 0.94,
        carbonEmissions: 0.12,
        fuelCost: 18,
        speedLimit: 65,
        roadQuality: 'good'
      },
      // Additional road connections
      {
        id: 'edge-dallas-atlanta-road',
        source: 'dallas-hub',
        target: 'atlanta-hub',
        mode: 'road',
        distance: 1280,
        baseTime: 780,
        baseCost: 1450,
        capacity: 26000,
        reliability: 0.90,
        carbonEmissions: 0.12,
        fuelCost: 310,
        tollCost: 40,
        speedLimit: 115,
        roadQuality: 'excellent'
      },
      {
        id: 'edge-atlanta-ny-road',
        source: 'atlanta-hub',
        target: 'ny-hub',
        mode: 'road',
        distance: 1380,
        baseTime: 840,
        baseCost: 1550,
        capacity: 25000,
        reliability: 0.91,
        carbonEmissions: 0.12,
        fuelCost: 330,
        tollCost: 55,
        speedLimit: 110,
        roadQuality: 'good'
      }
    ];

    return { nodes, edges };
  }

  /**
   * Generate random incidents for simulation
   */
  generateRandomIncidents(edgeIds: string[], count: number = 3) {
    const incidentTypes = ['accident', 'construction', 'weather', 'closure'] as const;
    const severities = ['low', 'medium', 'high', 'critical'] as const;

    return Array.from({ length: count }, (_, i) => ({
      id: `incident-${i}`,
      type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      location: {
        lat: 35 + Math.random() * 10,
        lng: -120 + Math.random() * 40
      },
      affectedEdges: [edgeIds[Math.floor(Math.random() * edgeIds.length)]],
      description: 'Simulated incident for testing',
      estimatedDuration: Math.floor(Math.random() * 480) + 60,
      timestamp: new Date()
    }));
  }
}
