# JusValida

## Overview

JusValida is a legal document analysis platform that uses AI providers (OpenAI, Anthropic, Google Gemini) to analyze legal documents and contracts. The application is built as a full-stack TypeScript solution with a React frontend and Express backend, using a credit-based system for AI analysis services integrated with Stripe for payments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Authentication**: Context-based authentication provider with session management

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Server Structure**: RESTful API with route-based organization
- **Session Management**: Express sessions for authentication state
- **File Handling**: Multer middleware for document uploads (PDF, DOC, DOCX, TXT)
- **Error Handling**: Centralized error handling middleware
- **Development Tools**: Hot reload with Vite integration in development

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Design**: 
  - Users table with credit system and Stripe customer integration
  - AI providers table for user-specific API key management
  - Document analyses table storing analysis results and metadata
  - Credit transactions for billing tracking
  - Support system with tickets and messages
- **Storage Interface**: Abstract storage interface (IStorage) with in-memory implementation for development

### AI Integration
- **Multi-Provider Support**: OpenAI (GPT-4, GPT-5), Anthropic (Claude Sonnet 4), Google Gemini
- **Service Architecture**: Centralized AIService class managing multiple AI provider clients
- **Analysis Types**: General, contract, legal, and compliance analysis modes
- **Credit System**: Different models consume different credit amounts based on complexity

### Authentication & Authorization
- **Session-based Authentication**: Express sessions with user state persistence
- **Password Security**: bcrypt for password hashing
- **User Management**: Registration, login, and profile management
- **API Key Management**: Secure storage and management of user AI provider keys

### Payment Integration
- **Stripe Integration**: Full payment processing with webhooks
- **Credit Packages**: Multiple credit tiers with volume discounts
- **Transaction Tracking**: Complete audit trail of credit purchases and usage
- **Customer Management**: Automatic Stripe customer creation and management

## External Dependencies

### Payment Processing
- **Stripe**: Complete payment infrastructure including React Stripe.js components, server-side payment processing, and webhook handling

### AI Services
- **OpenAI**: GPT-4 and GPT-5 models for document analysis
- **Anthropic**: Claude Sonnet 4 for specialized legal document processing
- **Google Generative AI**: Gemini Pro for cost-effective analysis options

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

### UI & Styling
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Replit Integration**: Development environment plugins for debugging and development banners
- **ESBuild**: Fast bundling for production server builds
- **TypeScript**: Full type safety across frontend, backend, and shared schemas