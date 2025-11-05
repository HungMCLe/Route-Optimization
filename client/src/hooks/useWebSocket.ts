import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
}

export const useWebSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [networkUpdates, setNetworkUpdates] = useState<any[]>([]);
  const [routeUpdates, setRouteUpdates] = useState<any[]>([]);
  const [analyticsUpdates, setAnalyticsUpdates] = useState<any>(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL);

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // Subscribe to all channels
      socketInstance.emit('subscribe:network');
      socketInstance.emit('subscribe:routes');
      socketInstance.emit('subscribe:analytics');
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('alert', (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
    });

    socketInstance.on('network:update', (data: any) => {
      setNetworkUpdates((prev) => [data, ...prev].slice(0, 100));
    });

    socketInstance.on('route:update', (data: any) => {
      setRouteUpdates((prev) => [data, ...prev].slice(0, 100));
    });

    socketInstance.on('analytics:update', (data: any) => {
      setAnalyticsUpdates(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  return {
    socket,
    isConnected,
    alerts,
    networkUpdates,
    routeUpdates,
    analyticsUpdates,
    clearAlerts,
    dismissAlert,
  };
};
