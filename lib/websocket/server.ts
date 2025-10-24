import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '@/lib/auth/session';
import { cache } from '@/lib/db/redis';
import { getUserById } from '@/lib/db/queries';

export interface SocketData {
  userId: number;
  organizationId?: number;
  userRole: string;
}

export interface ServerToClientEvents {
  // Scan events
  scanStatusUpdate: (data: {
    scanId: number;
    sessionId: string;
    status: string;
    progress?: number;
    message?: string;
  }) => void;
  
  scanResultUpdate: (data: {
    scanId: number;
    sessionId: string;
    newResults: number;
    totalResults: number;
    riskScore?: number;
  }) => void;
  
  // Dashboard events
  dashboardStatsUpdate: (data: {
    totalScans: number;
    completedScans: number;
    totalReports: number;
    totalRules: number;
    recentActivity: any[];
  }) => void;
  
  // System events
  systemNotification: (data: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: string;
  }) => void;
  
  // Real-time activity feed
  activityUpdate: (data: {
    id: number;
    action: string;
    description: string;
    timestamp: string;
    userName?: string;
  }) => void;
}

export interface ClientToServerEvents {
  // Join specific rooms
  joinScanRoom: (scanId: number) => void;
  leaveScanRoom: (scanId: number) => void;
  joinDashboard: () => void;
  leaveDashboard: () => void;
  
  // Request updates
  requestDashboardStats: () => void;
  requestScanStatus: (scanId: number) => void;
}

export class WebSocketManager {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> | null = null;
  private connectedUsers = new Map<string, SocketData>();

  init(server: HttpServer) {
    this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(server, {
      cors: {
        origin: process.env.BASE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.use(async (socket, next) => {
      try {
        // Authenticate the socket connection
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify the JWT token
        const tokenData = await verifyToken(token.replace('Bearer ', ''));
        if (!tokenData) {
          return next(new Error('Invalid token'));
        }

        // Get user data
        const user = await getUserById(tokenData.user.id);
        if (!user) {
          return next(new Error('User not found'));
        }

        // Store user data in socket
        socket.data = {
          userId: user.id,
          organizationId: user.organizationId || undefined,
          userRole: user.role,
        };

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      const userData = socket.data;
      this.connectedUsers.set(socket.id, userData);
      
      console.log(`User ${userData.userId} connected to WebSocket`);

      // Handle joining scan-specific rooms
      socket.on('joinScanRoom', (scanId: number) => {
        const roomName = `scan_${scanId}`;
        socket.join(roomName);
        console.log(`User ${userData.userId} joined scan room: ${roomName}`);
      });

      socket.on('leaveScanRoom', (scanId: number) => {
        const roomName = `scan_${scanId}`;
        socket.leave(roomName);
        console.log(`User ${userData.userId} left scan room: ${roomName}`);
      });

      // Handle dashboard room
      socket.on('joinDashboard', () => {
        const roomName = userData.organizationId 
          ? `dashboard_org_${userData.organizationId}`
          : `dashboard_user_${userData.userId}`;
        socket.join(roomName);
        console.log(`User ${userData.userId} joined dashboard room: ${roomName}`);
      });

      socket.on('leaveDashboard', () => {
        const roomName = userData.organizationId 
          ? `dashboard_org_${userData.organizationId}`
          : `dashboard_user_${userData.userId}`;
        socket.leave(roomName);
        console.log(`User ${userData.userId} left dashboard room: ${roomName}`);
      });

      // Handle dashboard stats request
      socket.on('requestDashboardStats', async () => {
        try {
          const stats = await this.getDashboardStats(userData.userId, userData.organizationId);
          socket.emit('dashboardStatsUpdate', stats);
        } catch (error) {
          console.error('Failed to get dashboard stats:', error);
        }
      });

      // Handle scan status request
      socket.on('requestScanStatus', async (scanId: number) => {
        try {
          const scanStatus = await this.getScanStatus(scanId, userData);
          if (scanStatus) {
            socket.emit('scanStatusUpdate', scanStatus);
          }
        } catch (error) {
          console.error('Failed to get scan status:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.id);
        console.log(`User ${userData.userId} disconnected from WebSocket`);
      });
    });

    return this.io;
  }

  // Emit scan status updates to all clients in the scan room
  emitScanStatusUpdate(scanId: number, data: Parameters<ServerToClientEvents['scanStatusUpdate']>[0]) {
    if (!this.io) return;
    
    const roomName = `scan_${scanId}`;
    this.io.to(roomName).emit('scanStatusUpdate', data);
  }

  // Emit scan result updates
  emitScanResultUpdate(scanId: number, data: Parameters<ServerToClientEvents['scanResultUpdate']>[0]) {
    if (!this.io) return;
    
    const roomName = `scan_${scanId}`;
    this.io.to(roomName).emit('scanResultUpdate', data);
  }

  // Emit dashboard updates to organization or user-specific rooms
  emitDashboardUpdate(userId: number, organizationId: number | undefined, data: Parameters<ServerToClientEvents['dashboardStatsUpdate']>[0]) {
    if (!this.io) return;
    
    const roomName = organizationId 
      ? `dashboard_org_${organizationId}`
      : `dashboard_user_${userId}`;
    
    this.io.to(roomName).emit('dashboardStatsUpdate', data);
  }

  // Emit system notifications
  emitSystemNotification(
    userId?: number, 
    organizationId?: number, 
    data: Parameters<ServerToClientEvents['systemNotification']>[0]
  ) {
    if (!this.io) return;

    if (userId && organizationId) {
      // Send to specific organization
      this.io.to(`dashboard_org_${organizationId}`).emit('systemNotification', data);
    } else if (userId) {
      // Send to specific user
      this.io.to(`dashboard_user_${userId}`).emit('systemNotification', data);
    } else {
      // Broadcast to all connected clients
      this.io.emit('systemNotification', data);
    }
  }

  // Emit activity updates
  emitActivityUpdate(
    userId: number, 
    organizationId: number | undefined, 
    data: Parameters<ServerToClientEvents['activityUpdate']>[0]
  ) {
    if (!this.io) return;
    
    const roomName = organizationId 
      ? `dashboard_org_${organizationId}`
      : `dashboard_user_${userId}`;
    
    this.io.to(roomName).emit('activityUpdate', data);
  }

  // Get dashboard statistics
  private async getDashboardStats(userId: number, organizationId?: number) {
    try {
      // Use existing function from queries
      const { getDashboardStats, getRecentScans } = await import('@/lib/db/queries');
      
      const stats = await getDashboardStats(userId, organizationId);
      const recentScans = await getRecentScans(userId, organizationId, 5);
      
      return {
        ...stats,
        recentActivity: recentScans,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalScans: 0,
        completedScans: 0,
        totalReports: 0,
        totalRules: 0,
        recentActivity: [],
      };
    }
  }

  // Get scan status
  private async getScanStatus(scanId: number, userData: SocketData) {
    try {
      const { db } = await import('@/lib/db/drizzle');
      const { scans } = await import('@/lib/db/schema');
      const { eq, and, or } = await import('drizzle-orm');
      
      const [scan] = await db
        .select()
        .from(scans)
        .where(
          and(
            eq(scans.id, scanId),
            userData.organizationId
              ? or(
                  eq(scans.userId, userData.userId),
                  eq(scans.organizationId, userData.organizationId)
                )
              : eq(scans.userId, userData.userId)
          )
        )
        .limit(1);

      if (!scan) return null;

      return {
        scanId: scan.id,
        sessionId: scan.sessionId,
        status: scan.status,
        progress: scan.completedChecks && scan.totalChecks 
          ? Math.round((scan.completedChecks / scan.totalChecks) * 100)
          : 0,
        message: `Scan ${scan.status}`,
      };
    } catch (error) {
      console.error('Error getting scan status:', error);
      return null;
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users by organization
  getConnectedUsersByOrg(organizationId: number): SocketData[] {
    return Array.from(this.connectedUsers.values()).filter(
      user => user.organizationId === organizationId
    );
  }

  // Close the WebSocket server
  close() {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    this.connectedUsers.clear();
  }
}

// Singleton instance
export const webSocketManager = new WebSocketManager();

// Helper functions for emitting events from other parts of the application
export const emitScanStatusUpdate = (
  scanId: number, 
  data: Parameters<ServerToClientEvents['scanStatusUpdate']>[0]
) => {
  webSocketManager.emitScanStatusUpdate(scanId, data);
};

export const emitScanResultUpdate = (
  scanId: number, 
  data: Parameters<ServerToClientEvents['scanResultUpdate']>[0]
) => {
  webSocketManager.emitScanResultUpdate(scanId, data);
};

export const emitDashboardUpdate = (
  userId: number, 
  organizationId: number | undefined, 
  data: Parameters<ServerToClientEvents['dashboardStatsUpdate']>[0]
) => {
  webSocketManager.emitDashboardUpdate(userId, organizationId, data);
};

export const emitSystemNotification = (
  data: Parameters<ServerToClientEvents['systemNotification']>[0],
  userId?: number, 
  organizationId?: number
) => {
  webSocketManager.emitSystemNotification(userId, organizationId, data);
};

export const emitActivityUpdate = (
  userId: number, 
  organizationId: number | undefined, 
  data: Parameters<ServerToClientEvents['activityUpdate']>[0]
) => {
  webSocketManager.emitActivityUpdate(userId, organizationId, data);
};