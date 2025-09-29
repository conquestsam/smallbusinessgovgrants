// NEW FILE: Complete WebSocket server implementation
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const httpServer = createServer();

// ENHANCED: Professional WebSocket server with JWT authentication
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL 
      : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// NEW: JWT Authentication middleware for WebSocket
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    socket.userEmail = decoded.email;
    
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// NEW: Connection handling with room management
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userEmail} (${socket.userRole})`);
  
  // Join user-specific room
  socket.join(`user_${socket.userId}`);
  
  // Join admin room if user is admin
  if (socket.userRole === 'admin') {
    socket.join('admin_room');
    console.log(`Admin ${socket.userEmail} joined admin room`);
  }

  // NEW: Handle real-time notifications
  socket.on('new_application', (data) => {
    // Notify all admins about new application
    io.to('admin_room').emit('admin_alert', {
      type: 'new_application',
      message: `New grant application from ${data.businessName}`,
      data: data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('new_withdrawal', (data) => {
    // Notify all admins about new withdrawal request
    io.to('admin_room').emit('admin_alert', {
      type: 'new_withdrawal',
      message: `New withdrawal request for $${data.amount.toLocaleString()}`,
      data: data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('application_status_update', (data) => {
    // Notify specific user about application status change
    io.to(`user_${data.userId}`).emit('status_update', {
      type: 'application_update',
      message: `Your application has been ${data.status}`,
      data: data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('withdrawal_status_update', (data) => {
    // Notify specific user about withdrawal status change
    io.to(`user_${data.userId}`).emit('status_update', {
      type: 'withdrawal_update',
      message: `Your withdrawal request has been ${data.status}`,
      data: data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userEmail}`);
  });
});

const PORT = process.env.WEBSOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// NEW: Export for use in API routes
module.exports = { io };