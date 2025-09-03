# Satış ve Üretim Yönetim Sistemi

## Overview

This is a comprehensive sales and production management system built for field sales personnel, production teams, and shipping departments. The application digitalizes business processes from initial customer visits through order fulfillment and delivery. It features mobile-first design for field sales operations, real-time location tracking, and role-based workflows for sales, production, shipping, and admin users.

The system follows a complete business workflow: sales personnel make customer visits with GPS tracking, create orders from successful visits, production teams manage manufacturing processes, shipping handles delivery logistics, and administrators oversee the entire operation through comprehensive dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern React features
- **Routing**: Wouter for lightweight client-side routing without the overhead of React Router
- **State Management**: TanStack Query (React Query) for server state management, caching, and synchronization
- **UI Components**: Radix UI primitives with shadcn/ui design system for accessible, customizable components
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture  
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript throughout for consistent type safety across the stack
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage for persistent user sessions

### Database Design
- **Primary Database**: PostgreSQL with connection pooling via Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Key Tables**: Users, customers, products, orders, order items, visits, appointments, and sessions
- **Data Relationships**: Proper foreign key constraints linking sales personnel to customers, orders to customers and products
- **Location Data**: GPS coordinates stored as decimal fields for geospatial queries

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect flow
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Role-based Access**: User roles (sales, production, shipping, admin) controlling feature access
- **Security**: HTTP-only cookies, secure session configuration, and proper CORS handling

### API Architecture
- **Design Pattern**: RESTful API with conventional HTTP methods and status codes
- **Request/Response**: JSON-based communication with Zod schema validation
- **Error Handling**: Centralized error middleware with consistent error response format
- **Logging**: Custom request/response logging with performance monitoring

### Mobile & Location Features
- **GPS Integration**: Native browser Geolocation API for real-time position tracking
- **Offline Considerations**: Local state management for handling connectivity issues
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces
- **Progressive Enhancement**: Core functionality works without JavaScript

### Real-time Features
- **Data Synchronization**: Automatic cache invalidation and refetching with React Query
- **Live Updates**: Optimistic updates for improved user experience
- **Background Sync**: Automatic data fetching and cache management

## External Dependencies

- **Database Provider**: Neon PostgreSQL serverless database for scalable data storage
- **Authentication Service**: Replit Auth for secure user authentication and authorization
- **Development Platform**: Replit for hosting, development environment, and deployment
- **UI Component Library**: Radix UI for accessible, unstyled component primitives
- **Icon Library**: Lucide React for consistent iconography
- **Geolocation Services**: Browser native Geolocation API for GPS functionality
- **Session Storage**: PostgreSQL for persistent session management
- **Build and Development**: Vite with React plugin for optimized development and production builds