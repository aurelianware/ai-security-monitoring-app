# Architecture Overview

## System Design

This is an AI-powered security monitoring application built as a monorepo using npm workspaces.

### Monorepo Structure

```
.
├── apps/           # User-facing applications
├── services/       # Backend services
├── packages/       # Shared libraries and utilities
├── infra/          # Infrastructure as code
└── docs/           # Documentation
```

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **AI/ML**: TensorFlow.js with COCO-SSD model
- **Camera**: WebRTC Media APIs with canvas overlay
- **Styling**: Tailwind CSS + Framer Motion
- **Storage**: IndexedDB + Azure Blob Storage
- **Authentication**: NextAuth.js + OAuth providers
- **Database**: Prisma + SQLite/PostgreSQL
- **PWA**: Workbox + Service Workers
- **Build**: Vite with TypeScript compilation
- **Deployment**: Azure, Vercel/Netlify ready

## Core Components

### Object Detection
- Real-time video stream processing
- TensorFlow.js COCO-SSD model
- Security-relevant class detection (person, vehicle, etc.)
- Confidence threshold filtering

### Storage Layer
- IndexedDB for local event storage
- Azure Blob Storage for cloud backup
- SAS token authentication

### Authentication
- OAuth 2.0 (Google, GitHub)
- Session-based authentication via NextAuth.js
- Prisma adapter for database sessions

## Security Considerations

- Content Security Policy (CSP) headers
- SAS token-based cloud storage access
- No secrets in source code
- Regular security scanning with CodeQL
- Dependency vulnerability scanning

## Future Enhancements

- Microservices architecture for backend
- Shared component library
- Automated E2E testing
- Advanced analytics dashboard
