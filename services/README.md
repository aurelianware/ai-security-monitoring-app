# Services

This directory contains backend services.

## Future Services

```
services/
├── api/           # REST API service
├── auth/          # Authentication service
├── storage/       # Storage service
└── analytics/     # Analytics service
```

Each service should have:
- Its own `package.json`
- Independent deployment configuration
- Shared dependencies from `packages/`
- API documentation
