// NEW FILE: WebSocket server setup
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handler(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // WebSocket authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // WebSocket connection handling
  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Join user-specific room
    socket.join(`user_${socket.userId}`);
    
    // Join admin room if admin
    if (socket.userRole === 'admin') {
      socket.join('admin_room');
    }

    // Handle real-time events
    socket.on('application_status_update', (data) => {
      io.to(`user_${data.userId}`).emit('status_update', data);
    });

    socket.on('withdrawal_status_update', (data) => {
      io.to(`user_${data.userId}`).emit('withdrawal_update', data);
    });

    socket.on('admin_notification', (data) => {
      io.to('admin_room').emit('admin_alert', data);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});