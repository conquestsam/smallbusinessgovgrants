// NEW FILE: WebSocket service for real-time communication
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

export class WebSocketService {
  private static io: SocketIOServer;

  static initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected`);
      
      // Join user-specific room
      socket.join(`user_${socket.userId}`);
      
      // Join admin room if admin
      if (socket.userRole === 'admin') {
        socket.join('admin_room');
      }

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });
    });
  }

  static emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  static emitToAdmins(event: string, data: any) {
    if (this.io) {
      this.io.to('admin_room').emit(event, data);
    }
  }

  static emitToAll(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

declare module 'socket.io' {
  interface Socket {
    userId: string;
    userRole: string;
  }
}