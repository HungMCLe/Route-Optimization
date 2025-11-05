import { Server as SocketIOServer } from 'socket.io';
import type { Server } from 'http';

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private static instance: WebSocketService;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  initialize(httpServer: Server) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('subscribe:network', () => {
        socket.join('network-updates');
        console.log(`Client ${socket.id} subscribed to network updates`);
      });

      socket.on('subscribe:routes', () => {
        socket.join('route-updates');
        console.log(`Client ${socket.id} subscribed to route updates`);
      });

      socket.on('subscribe:analytics', () => {
        socket.join('analytics-updates');
        console.log(`Client ${socket.id} subscribed to analytics updates`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    // Simulate real-time updates
    this.startSimulation();
  }

  /**
   * Broadcast network update
   */
  broadcastNetworkUpdate(data: any) {
    if (this.io) {
      this.io.to('network-updates').emit('network:update', data);
    }
  }

  /**
   * Broadcast route update
   */
  broadcastRouteUpdate(data: any) {
    if (this.io) {
      this.io.to('route-updates').emit('route:update', data);
    }
  }

  /**
   * Broadcast analytics update
   */
  broadcastAnalyticsUpdate(data: any) {
    if (this.io) {
      this.io.to('analytics-updates').emit('analytics:update', data);
    }
  }

  /**
   * Broadcast alert
   */
  broadcastAlert(alert: {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
  }) {
    if (this.io) {
      this.io.emit('alert', alert);
    }
  }

  /**
   * Simulate real-time updates
   */
  private startSimulation() {
    // Simulate network congestion updates every 10 seconds
    setInterval(() => {
      const congestionUpdate = {
        edgeId: `edge-${Math.floor(Math.random() * 10)}`,
        congestionLevel: Math.random(),
        timestamp: new Date()
      };
      this.broadcastNetworkUpdate(congestionUpdate);
    }, 10000);

    // Simulate route completions every 15 seconds
    setInterval(() => {
      const routeUpdate = {
        routeId: `RT-${Math.floor(Math.random() * 1000)}`,
        status: ['in_progress', 'completed', 'delayed'][Math.floor(Math.random() * 3)],
        progress: Math.floor(Math.random() * 100),
        timestamp: new Date()
      };
      this.broadcastRouteUpdate(routeUpdate);
    }, 15000);

    // Simulate analytics updates every 20 seconds
    setInterval(() => {
      const analyticsUpdate = {
        activeRoutes: 230 + Math.floor(Math.random() * 40),
        avgCost: 9500 + Math.floor(Math.random() * 1000),
        avgTime: 235 + Math.floor(Math.random() * 30),
        co2Saved: 18.2 + Math.random() * 5,
        timestamp: new Date()
      };
      this.broadcastAnalyticsUpdate(analyticsUpdate);
    }, 20000);

    // Simulate random alerts
    setInterval(() => {
      if (Math.random() > 0.7) {
        const alertTypes = ['info', 'warning', 'error', 'success'] as const;
        const alerts = [
          { type: 'info', title: 'Route Optimized', message: 'New optimal route found for shipment RT-1245' },
          { type: 'warning', title: 'Traffic Delay', message: 'Heavy traffic detected on I-95 corridor' },
          { type: 'error', title: 'Route Blocked', message: 'Road closure on edge-chicago-ny-road' },
          { type: 'success', title: 'Delivery Complete', message: 'Shipment RT-1238 delivered on time' }
        ];

        const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
        this.broadcastAlert({
          id: `alert-${Date.now()}`,
          type: randomAlert.type,
          title: randomAlert.title,
          message: randomAlert.message,
          timestamp: new Date()
        });
      }
    }, 30000);
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}
