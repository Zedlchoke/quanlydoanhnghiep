# Phần Mềm Quản Lý Doanh Nghiệp Royal Việt Nam

## Overview

This is a full-stack business management application built with React, TypeScript, and Express.js. The system provides CRUD operations for managing business entities, featuring a modern UI built with shadcn/ui components and Tailwind CSS. The application includes comprehensive search functionality, pagination, secure delete operations with password protection, advanced document management with Word export and PDF upload functionality for signed document tracking workflows, and a simplified 2-tier authentication system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas for request/response validation
- **API Design**: RESTful API with proper HTTP status codes and error handling
- **Development**: Hot reload with tsx for server-side development

### Data Layer
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Schema**: Single `businesses` table with fields: name, taxId, address, phone, email, website, industry, contactPerson, account, password, notes, createdAt
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Connection pooling with @neondatabase/serverless

### Security & Authentication
- **2-Tier Authentication System**: Simplified authentication with Admin (username/password) and Employee (hidden password "royalvietnam")
- **Delete Protection**: Password-protected delete operations (hardcoded password: "0102")
- **Input Validation**: Comprehensive validation using Zod schemas
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Object Storage**: Secure file upload/download for document workflows

### Key Features
- **CRUD Operations**: Full create, read, update, delete functionality for businesses
- **Search System**: Multi-field search with exact and partial matching
- **Pagination**: Server-side pagination for efficient data loading
- **Form Management**: Advanced form handling with validation and error display
- **Toast Notifications**: User feedback system for all operations
- **Responsive Design**: Mobile-first responsive UI

### Development Environment
- **Replit Integration**: Custom Vite plugins for Replit development
- **TypeScript Configuration**: Strict TypeScript with path mapping
- **Code Organization**: Monorepo structure with shared types between client and server

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management tool

### Frontend UI Dependencies
- **@radix-ui/***: Comprehensive set of headless UI primitives
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Zod integration for form validation
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for components
- **lucide-react**: Icon library

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **@replit/vite-plugin-***: Replit-specific development plugins
- **postcss**: CSS processing with Tailwind
- **wouter**: Lightweight routing library

### Utility Libraries
- **zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional className utility
- **nanoid**: Unique ID generation

The application follows modern React patterns with server-side rendering considerations, type safety throughout the stack, and a component-driven architecture suitable for scalable business applications.