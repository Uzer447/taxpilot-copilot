import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For development, allow all
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = decoded; // { userId: '...' }
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.user.userId})`);

    // Join a room unique to the user, so we can broadcast to all their devices (extension + website)
    socket.join(`user_${socket.user.userId}`);

    // Listen for context updates from the extension
    socket.on('extension:page_context', (data) => {
      console.log(`[Socket] Received page context for User: ${socket.user.userId}`);
      // Broadcast this to the user's web dashboard (or other connected clients)
      // so it can trigger Live Review Mode
      socket.to(`user_${socket.user.userId}`).emit('website:live_review_context', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
