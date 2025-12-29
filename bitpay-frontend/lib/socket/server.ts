/**
 * Socket.io Server Configuration
 * Provides real-time WebSocket broadcasting for blockchain events
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HTTPServer) => {
  if (io) {
    console.log('⚡ Socket.io already initialized');
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join user-specific room based on wallet address
    socket.on('join-user-room', (walletAddress: string) => {
      if (walletAddress) {
        socket.join(`user:${walletAddress}`);
        console.log(`👤 User ${walletAddress} joined their room`);
      }
    });

    // Join stream-specific room
    socket.on('join-stream-room', (streamId: string) => {
      if (streamId) {
        socket.join(`stream:${streamId}`);
        console.log(`📊 Client joined stream room: ${streamId}`);
      }
    });

    // Leave stream room
    socket.on('leave-stream-room', (streamId: string) => {
      if (streamId) {
        socket.leave(`stream:${streamId}`);
        console.log(`📊 Client left stream room: ${streamId}`);
      }
    });

    // Join marketplace room
    socket.on('join-marketplace', () => {
      socket.join('marketplace');
      console.log('🛒 Client joined marketplace room');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  console.log('⚡ Socket.io server initialized');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocketServer first.');
  }
  return io;
};

// Event broadcasting helpers
export const broadcastToUser = (walletAddress: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${walletAddress}`).emit(event, data);
    console.log(`📤 Broadcast to user ${walletAddress}:`, event);
  }
};

export const broadcastToStream = (streamId: string, event: string, data: any) => {
  if (io) {
    io.to(`stream:${streamId}`).emit(event, data);
    console.log(`📤 Broadcast to stream ${streamId}:`, event);
  }
};

export const broadcastToMarketplace = (event: string, data: any) => {
  if (io) {
    io.to('marketplace').emit(event, data);
    console.log(`📤 Broadcast to marketplace:`, event);
  }
};

export const broadcastGlobal = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
    console.log(`📤 Global broadcast:`, event);
  }
};
