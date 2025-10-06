# Travner Web Frontend

A modern Angular application for the Travner platform, featuring community posts, marketplace, user authentication, and real-time chat functionality.

## 🚀 Features

- **Authentication & User Management**: Secure login/signup with JWT tokens
- **Community Posts**: Create, view, and interact with community content
- **Marketplace**: Browse and manage marketplace items
- **Real-time Chat**: WebSocket-based messaging system with HTTP polling fallback
- **Responsive Design**: Mobile-first responsive UI
- **Admin Panel**: Administrative features for user and content management

## 🛠️ Technology Stack

- **Frontend**: Angular 18+ with standalone components
- **UI Framework**: Modern CSS with responsive design
- **State Management**: RxJS observables and services
- **Real-time Communication**: WebSocket (STOMP) with HTTP polling fallback
- **Build Tool**: Angular CLI with production optimizations
- **Deployment**: Vercel with Railway backend integration

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Angular CLI

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd travner-web-frontend

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200`

### Production Build
```bash
# Build for production
npm run build

# The build artifacts will be stored in the `dist/` directory
```

## 🌐 Environment Configuration

The application automatically detects the environment and configures API endpoints:

- **Development**: Uses proxy configuration to `localhost:8080`
- **Production (Vercel)**: Connects to Railway backend
- **Other environments**: Falls back to Railway backend

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run lint` - Run linting

## 📱 Features Overview

### Authentication
- JWT-based authentication
- Secure route guards
- Automatic token refresh

### Community Posts
- Create and view posts
- Image upload support
- Comments and interactions

### Marketplace
- Product listings
- Cart functionality
- User marketplace management

### Chat System
- Real-time messaging via WebSocket
- HTTP polling fallback when WebSocket unavailable
- Conversation management
- Typing indicators and presence (when WebSocket available)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables if needed
3. Deploy automatically on push to main branch

### Manual Deployment
1. Run `npm run build`
2. Upload the `dist/` folder to your web server
3. Configure web server for SPA routing

## 🔒 Security

- JWT token authentication
- CORS protection
- Input validation
- Secure API communication

## 📞 Support

For support and questions, please refer to the project documentation or contact the development team.

## 📄 License

[Add your license information here]