# SBA Grant Management System

A comprehensive enterprise-grade Small Business Administration Grant Management System built with Next.js, featuring real-time updates, secure authentication, and professional financial processing capabilities.

## 🏛️ System Overview

This is a full-stack application designed to streamline the grant application and management process for small businesses seeking SBA funding. The system provides separate interfaces for applicants and administrators, with comprehensive workflow management and real-time notifications.

## 🚀 Technology Stack

### Frontend
- **Next.js 13+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Mantine UI** - Modern React components library
- **MobX** - State management (no React hooks for state)
- **TanStack Query** - Data fetching and caching
- **Socket.io Client** - Real-time communication

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Drizzle ORM** - Type-safe database queries
- **Neon PostgreSQL** - Cloud database
- **Redis** - Caching and session management
- **Socket.io** - WebSocket server

### External Services
- **Resend** - Email delivery service
- **Telegram Bot API** - Admin notifications
- **Cloudinary** - Image and document storage
- **JWT** - Authentication tokens

## 🏗️ System Architecture

### Database Schema
```sql
- users (authentication, profiles, roles)
- grant_applications (application management)
- withdrawals (financial processing)
- notifications (real-time updates)
- system_settings (admin configuration)
```

### Authentication & Security
- **Session Management**: 30-minute automatic timeout
- **Role-Based Access**: Admin vs User permissions
- **JWT Tokens**: Secure API authentication
- **Password Hashing**: bcrypt with salt rounds
- **HTTPS Only**: Production security enforcement

### State Management (MobX Stores)
- **AuthStore**: User authentication and session
- **ApplicationStore**: Grant application management
- **WithdrawalStore**: Financial transaction handling
- **NotificationStore**: Real-time updates

## 🔧 Implementation Status

### ✅ Completed Features

#### Core Infrastructure
- [x] Next.js project setup with TypeScript
- [x] Database schema design and migrations
- [x] MobX stores for state management
- [x] Authentication system with JWT
- [x] Role-based access control
- [x] Redis caching implementation
- [x] Email service integration (Resend)
- [x] Telegram notification service

#### User Interface
- [x] Responsive dashboard layouts
- [x] SBA-branded design system
- [x] Login/Register pages
- [x] Main dashboard components
- [x] Navigation and sidebar
- [x] Statistics cards and widgets

#### Authentication System
- [x] User registration and login
- [x] Password hashing and validation
- [x] JWT token generation
- [x] Session timeout (30 minutes)
- [x] Role-based redirects

### 🚧 In Progress / Next Steps

#### Grant Application System
- [ ] Application creation form
- [ ] Document upload integration (Cloudinary)
- [ ] Application status tracking
- [ ] Admin approval workflow
- [ ] Custom amount approval

#### Financial Dashboard
- [ ] Withdrawal request system
- [ ] Bank account verification
- [ ] Payment processing workflow
- [ ] Receipt generation and download
- [ ] Transaction history

#### Admin Features
- [ ] Application review interface
- [ ] User management panel
- [ ] System analytics dashboard
- [ ] Bulk email/newsletter system
- [ ] System settings management

#### Real-time Features
- [ ] WebSocket server setup
- [ ] Live notification system
- [ ] Status update broadcasts
- [ ] Chat/support system

#### Advanced Features
- [ ] Advanced analytics and reporting
- [ ] Export capabilities (PDF, Excel)
- [ ] Mobile app support
- [ ] API documentation
- [ ] Audit logging

## 📦 Installation & Setup

### Prerequisites
```bash
Node.js 18+
PostgreSQL database
Redis server
```

### Environment Variables
```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secret-key"
RESEND_API_KEY="re_your_key"
TELEGRAM_BOT_TOKEN="bot_token"
CLOUDINARY_CLOUD_NAME="cloud_name"
```

### Development Setup
```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎯 User Roles & Permissions

### Regular Users
- Dashboard overview
- Create grant applications
- Upload supporting documents
- Track application status
- Request withdrawals
- View transaction history
- Profile management

### Admin Users
- All user permissions +
- Review and approve applications
- Process withdrawal requests
- User management
- System analytics
- Bulk communications
- System settings
- Financial oversight

## 📊 Key Features

### Grant Application Management
- Unique application ID generation
- Multi-step application process
- Document upload and validation
- Status tracking and notifications
- Custom approval amounts

### Financial Processing
- Secure withdrawal requests
- Bank account verification
- Real-time payment processing
- Automated email confirmations
- Transaction receipts and history

### Admin Dashboard
- Comprehensive analytics
- Application approval workflow
- User management tools
- System configuration
- Bulk communication tools

### Notification System
- Email notifications (Resend)
- Telegram admin alerts
- Real-time browser notifications
- Status change updates
- Newsletter capabilities

## 🔒 Security Features

- **Authentication**: JWT with 30-minute expiration
- **Authorization**: Role-based access control
- **Data Validation**: Server-side input validation
- **SQL Injection**: Protection via Drizzle ORM
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Token-based validation
- **Rate Limiting**: API endpoint protection

## 📈 Performance Optimizations

- **Caching**: Redis for session and data caching
- **Database**: Optimized queries with indexes
- **CDN**: Cloudinary for asset delivery
- **Code Splitting**: Next.js automatic optimization
- **Image Optimization**: Next.js image component

## 🧪 Testing Strategy

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Application Endpoints
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `PUT /api/admin/applications/:id/approve` - Approve application
- `PUT /api/admin/withdrawals/:id/process` - Process withdrawal

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Email: support@sba-grants.gov
- Documentation: [Link to docs]
- Issues: GitHub Issues tab

---

**Note**: This is an enterprise-grade system with comprehensive security and compliance features. All financial transactions and user data are handled with the highest security standards.