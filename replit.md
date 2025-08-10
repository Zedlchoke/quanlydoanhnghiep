# Phần Mềm Quản Lý Doanh Nghiệp Royal Việt Nam

## Overview

This is a full-stack business management application built with React, TypeScript, and Express.js. The system provides CRUD operations for managing business entities, featuring a modern UI built with shadcn/ui components and Tailwind CSS. The application includes comprehensive search functionality, pagination, secure delete operations with password protection, advanced document management with Word export and PDF upload functionality for signed document tracking workflows, simplified 2-tier authentication system, and comprehensive account management with 7 detailed account types stored directly in the businesses table.

## Recent Changes (August 2025)

### Document Transaction UI Improvements - Completed ✅ (August 10, 2025)
- **Form title update**: Changed from "Thêm Giao Dịch Hồ Sơ (Nhiều Hồ Sơ)" to "Thêm Giao Dịch Hồ Sơ"
- **Single-line layout implementation**: Document list now displays as [Dropdown loại hồ sơ] + [Input số lượng] + [Dropdown đơn vị] + [Nút X xóa]
- **Enhanced automatic handover reports**: Document reports now itemize each document type with corresponding quantities
- **Multi-document support**: Maintains ability to create transactions with multiple document types in single transaction
- **Notes field integration**: Properly displays and syncs Notes field between form and generated reports

### API Integration & Testing - Fully Resolved ✅ (August 10, 2025)
- **Critical API routing bug resolved**: Fixed incorrect endpoint usage from `/api/documents` to `/api/businesses/:businessId/documents`
- **Comprehensive API testing completed**: Successfully tested real-world user workflow without direct database access
- **Document transaction creation**: Successfully created 5 new transactions (IDs: 40-44) for business relationships
- **Authentication system verified**: Login endpoint working with proper token generation and validation
- **Real-time data synchronization**: UI automatically updates transaction counts (27→31) without manual refresh
- **Vietnamese business workflow**: Tested complete document flow between Công Ty Y ↔ Công Ty Z with proper UTF-8 support

### PDF Document Management - Fully Functional ✅
- Fixed critical duplicate method bug in database storage layer that prevented PDF updates
- Implemented exact PDF workflow: "Chưa có file" → "Choose file" button → auto upload → filename link + red X delete
- Added proper UTF-8 filename support for Vietnamese filenames in download headers
- Confirmed toast notifications work correctly: "Tải lên thành công" / "Tải lên thất bại"
- File replacement requires deletion before upload (prevents overwriting)
- All CRUD operations tested and verified working: upload, download, delete, replace

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
- **Schema**: Single `businesses` table with comprehensive fields including basic business information and 7 account types: tax accounts (ID+pass), HĐĐT lookup (ID+pass), Web HĐĐT (website+ID+pass), social insurance (insurance code+ID+main pass+sub pass), TOKEN (ID+pass+provider+registration date+expiry date+management location), statistics (ID+pass), audit software (website+ID+pass)
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
- **Account Management**: 7 detailed account types (tax accounts, HĐĐT lookup, Web HĐĐT, social insurance, TOKEN, statistics, audit software) with visible, copyable passwords
- **Business Information Viewing**: Read-only modal for viewing complete business and account information
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