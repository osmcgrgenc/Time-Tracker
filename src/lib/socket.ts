import { Server, Socket } from 'socket.io';
import { getToken } from 'next-auth/jwt';
import { MemoryCache } from '@/lib/cache/MemoryCache';

// Extend Socket interface to include user properties
declare module 'socket.io' {
  interface Socket {
    userId?: string;
    userEmail?: string;
  }
}

interface WebSocketMetrics {
  activeConnections: number;
  totalMessages: number;
  connectionsToday: number;
  messagesPerMinute: number;
  averageSessionDuration: number;
}
interface ConnectionHistory {timestamp: number; connections: number}

class WebSocketMonitor {
  private static instance: WebSocketMonitor;
  private cache: MemoryCache;
  private connectionStartTimes: Map<string, number> = new Map();
  private messageCount = 0;
  private lastMessageTime = Date.now();

  private constructor() {
    this.cache = MemoryCache.getInstance();
  }

  static getInstance(): WebSocketMonitor {
    if (!WebSocketMonitor.instance) {
      WebSocketMonitor.instance = new WebSocketMonitor();
    }
    return WebSocketMonitor.instance;
  }

  async onConnection(socketId: string, userId: string) {
    this.connectionStartTimes.set(socketId, Date.now());
    
    // Increment active connections
    const activeKey = 'metrics:ws:active_connections';
    const todayKey = 'metrics:ws:connections_today';
    
    const currentActive = parseInt(this.cache.get(activeKey) || '0');
    const currentToday = parseInt(this.cache.get(todayKey) || '0');
    
    this.cache.set(activeKey, (currentActive + 1).toString());
    this.cache.set(todayKey, (currentToday + 1).toString());
    
    console.log(`WebSocket connection tracked: ${socketId} (User: ${userId})`);
  }

  async onDisconnection(socketId: string, userId: string) {
    const startTime = this.connectionStartTimes.get(socketId);
    if (startTime) {
      const sessionDuration = Date.now() - startTime;
      
      // Update average session duration
      const currentAvg = this.cache.get('metrics:ws:avg_session_duration') || '0';
      const currentCount = this.cache.get('metrics:ws:session_count') || '0';
      
      const newCount = parseInt(currentCount) + 1;
      const newAvg = (parseInt(currentAvg) * parseInt(currentCount) + sessionDuration) / newCount;
      
      this.cache.set('metrics:ws:avg_session_duration', newAvg.toString());
      this.cache.set('metrics:ws:session_count', newCount.toString());
      
      this.connectionStartTimes.delete(socketId);
    }
    
    // Decrement active connections
    const current = this.cache.get('metrics:ws:active_connections') || '0';
    const newCount = Math.max(0, parseInt(current) - 1);
    this.cache.set('metrics:ws:active_connections', newCount.toString());
    
    console.log(`WebSocket disconnection tracked: ${socketId} (User: ${userId})`);
  }

  async onMessage(socketId: string, userId: string, messageType: string = 'message') {
    this.messageCount++;
    
    // Increment total messages
    const totalKey = 'metrics:ws:total_messages';
    const todayKey = 'metrics:ws:messages_today';
    
    const currentTotal = parseInt(this.cache.get(totalKey) || '0');
    const currentToday = parseInt(this.cache.get(todayKey) || '0');
    
    this.cache.set(totalKey, (currentTotal + 1).toString());
    this.cache.set(todayKey, (currentToday + 1).toString());
    
    // Update messages per minute (sliding window)
    const now = Date.now();
    const minuteKey = `metrics:ws:messages_minute:${Math.floor(now / 60000)}`;
    const currentMinute = parseInt(this.cache.get(minuteKey) || '0');
    this.cache.set(minuteKey, (currentMinute + 1).toString());
    
    this.lastMessageTime = now;
  }

  async getMetrics(): Promise<WebSocketMetrics> {
    const activeConnections = parseInt(this.cache.get('metrics:ws:active_connections') || '0');
    const totalMessages = parseInt(this.cache.get('metrics:ws:total_messages') || '0');
    const connectionsToday = parseInt(this.cache.get('metrics:ws:connections_today') || '0');
    const avgSessionDuration = parseFloat(this.cache.get('metrics:ws:avg_session_duration') || '0');
    
    // Calculate messages per minute from recent data
    const currentMinute = Math.floor(Date.now() / 60000);
    const recentMinutes = Array<number>();
    for (let i = 0; i < 5; i++) {
      const minuteKey = `metrics:ws:messages_minute:${currentMinute - i}`;
      const count = parseInt(this.cache.get(minuteKey) || '0');
      recentMinutes.push(count);
    }
    const messagesPerMinute = recentMinutes.reduce((sum, count) => sum + count, 0) / 5;
    
    return {
       activeConnections,
       totalMessages,
       connectionsToday,
       messagesPerMinute: Math.round(messagesPerMinute),
       averageSessionDuration: Math.round(avgSessionDuration)
     };
   }

  async getConnectionHistory(hours: number = 24) {
    const history = Array<ConnectionHistory>();
    const now = Date.now();
    
    for (let i = 0; i < hours; i++) {
      const hourKey = `metrics:ws:connections_hour:${Math.floor((now - i * 3600000) / 3600000)}`;
      const count = parseInt(this.cache.get(hourKey) || '0');
      history.unshift({
        timestamp: now - i * 3600000,
        connections: count
      });
    }
    
    return history;
  }
}

export const setupSocket = (io: Server) => {
  const monitor = WebSocketMonitor.getInstance();
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = await getToken({ 
        req: {
          headers: {
            authorization: `Bearer ${token}`
          }
        } as any,
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      if (!decoded || !decoded.sub) {
        return next(new Error('Invalid authentication token'));
      }

      // Attach user info to socket
      socket.userId = decoded.sub;
      socket.userEmail = decoded.email;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`Authenticated client connected: ${socket.id} (User: ${socket.userId})`);
    
    // Track connection
    await monitor.onConnection(socket.id, socket.userId || 'unknown');
    
    // Handle messages (now with user authentication)
    socket.on('message', async (msg: { text: string }) => {
      // Track message
      await monitor.onMessage(socket.id, socket.userId || 'unknown', 'user_message');
      // Validate that user is authenticated
      if (!socket.userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Echo: broadcast message with authenticated user info
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: socket.userId,
        senderEmail: socket.userEmail,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`Authenticated client disconnected: ${socket.id} (User: ${socket.userId})`);
      
      // Track disconnection
      await monitor.onDisconnection(socket.id, socket.userId || 'unknown');
    });

    // Send welcome message with user info
    socket.emit('message', {
      text: `Welcome to secure WebSocket server, ${socket.userEmail}!`,
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

export { WebSocketMonitor };
export type { WebSocketMetrics };