# Apps

This directory contains user-facing applications.

## Current Applications

Currently empty. The existing web application will be moved here in a future PR.

## Future Structure

```
apps/
├── web/           # Main web application
├── mobile/        # Mobile application (optional)
└── desktop/       # Desktop application (optional)
```

Each app should have:
- Its own `package.json`
- Independent build configuration
- Shared dependencies from `packages/`
