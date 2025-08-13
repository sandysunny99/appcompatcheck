'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth/useAuth';
import type { ServerToClientEvents, ClientToServerEvents } from './server';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: any;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { 
    autoConnect = true, 
    reconnectionAttempts = 5, 
    reconnectionDelay = 1000 
  } = options;

  const { user, token } = useAuth();
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
  });

  const connect = useCallback(() => {
    if (!token || !user) {
      setState(prev => ({ ...prev, error: 'Authentication required' }));
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    const socket = io(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000', {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts,
      reconnectionDelay,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setState(prev => ({ 
        ...prev, 
        connected: true, 
        connecting: false, 
        error: null 
      }));
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setState(prev => ({ 
        ...prev, 
        connected: false, 
        connecting: false 
      }));
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setState(prev => ({ 
        ...prev, 
        connected: false, 
        connecting: false, 
        error: error.message 
      }));
    });

    // Store last received message for debugging
    const originalEmit = socket.emit;
    socket.emit = function(...args) {
      setState(prev => ({ ...prev, lastMessage: { type: 'sent', data: args } }));
      return originalEmit.apply(this, args);
    };

    socketRef.current = socket;
  }, [token, user, reconnectionAttempts, reconnectionDelay]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState(prev => ({ 
      ...prev, 
      connected: false, 
      connecting: false 
    }));
  }, []);

  // Auto-connect when authentication is available
  useEffect(() => {
    if (autoConnect && token && user && !socketRef.current) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [autoConnect, token, user, connect]);

  // Socket event listeners
  const on = useCallback(<T extends keyof ServerToClientEvents>(
    event: T, 
    callback: ServerToClientEvents[T]
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback(<T extends keyof ServerToClientEvents>(
    event: T, 
    callback?: ServerToClientEvents[T]
  ) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  const emit = useCallback(<T extends keyof ClientToServerEvents>(
    event: T,
    ...args: Parameters<ClientToServerEvents[T]>
  ) => {
    if (socketRef.current?.connected) {
      // @ts-ignore - TypeScript has issues with generic event emission
      socketRef.current.emit(event, ...args);
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    on,
    off,
    emit,
    socket: socketRef.current,
  };
}

// Specialized hook for scan updates
export function useScanUpdates(scanId?: number) {
  const { on, off, emit, connected } = useWebSocket();
  const [scanStatus, setScanStatus] = useState<{
    status: string;
    progress: number;
    message?: string;
  } | null>(null);

  const [scanResults, setScanResults] = useState<{
    newResults: number;
    totalResults: number;
    riskScore?: number;
  } | null>(null);

  useEffect(() => {
    if (!connected || !scanId) return;

    const handleStatusUpdate = (data: Parameters<ServerToClientEvents['scanStatusUpdate']>[0]) => {
      if (data.scanId === scanId) {
        setScanStatus({
          status: data.status,
          progress: data.progress || 0,
          message: data.message,
        });
      }
    };

    const handleResultUpdate = (data: Parameters<ServerToClientEvents['scanResultUpdate']>[0]) => {
      if (data.scanId === scanId) {
        setScanResults({
          newResults: data.newResults,
          totalResults: data.totalResults,
          riskScore: data.riskScore,
        });
      }
    };

    on('scanStatusUpdate', handleStatusUpdate);
    on('scanResultUpdate', handleResultUpdate);

    // Join scan room and request initial status
    emit('joinScanRoom', scanId);
    emit('requestScanStatus', scanId);

    return () => {
      off('scanStatusUpdate', handleStatusUpdate);
      off('scanResultUpdate', handleResultUpdate);
      emit('leaveScanRoom', scanId);
    };
  }, [connected, scanId, on, off, emit]);

  return {
    scanStatus,
    scanResults,
    connected,
  };
}

// Specialized hook for dashboard updates
export function useDashboardUpdates() {
  const { on, off, emit, connected } = useWebSocket();
  const [dashboardStats, setDashboardStats] = useState<{
    totalScans: number;
    completedScans: number;
    totalReports: number;
    totalRules: number;
    recentActivity: any[];
  } | null>(null);

  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: string;
  }>>([]);

  const [recentActivity, setRecentActivity] = useState<Array<{
    id: number;
    action: string;
    description: string;
    timestamp: string;
    userName?: string;
  }>>([]);

  useEffect(() => {
    if (!connected) return;

    const handleStatsUpdate = (data: Parameters<ServerToClientEvents['dashboardStatsUpdate']>[0]) => {
      setDashboardStats(data);
    };

    const handleNotification = (data: Parameters<ServerToClientEvents['systemNotification']>[0]) => {
      const notification = {
        id: `${Date.now()}-${Math.random()}`,
        ...data,
      };
      setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep last 10
    };

    const handleActivityUpdate = (data: Parameters<ServerToClientEvents['activityUpdate']>[0]) => {
      setRecentActivity(prev => [data, ...prev].slice(0, 20)); // Keep last 20
    };

    on('dashboardStatsUpdate', handleStatsUpdate);
    on('systemNotification', handleNotification);
    on('activityUpdate', handleActivityUpdate);

    // Join dashboard room and request initial data
    emit('joinDashboard');
    emit('requestDashboardStats');

    return () => {
      off('dashboardStatsUpdate', handleStatsUpdate);
      off('systemNotification', handleNotification);
      off('activityUpdate', handleActivityUpdate);
      emit('leaveDashboard');
    };
  }, [connected, on, off, emit]);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    dashboardStats,
    notifications,
    recentActivity,
    connected,
    clearNotification,
    clearAllNotifications,
  };
}