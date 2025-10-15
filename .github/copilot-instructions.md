# GitHub Copilot Instructions

## Project Overview

This is an **AI-powered security monitoring application** that uses computer vision and machine learning for real-time object detection in video streams. The application is built as a Progressive Web App (PWA) with optional desktop and mobile deployment capabilities.

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **AI/ML**: TensorFlow.js with COCO-SSD and YOLO models
- **Styling**: Tailwind CSS + Framer Motion
- **Storage**: IndexedDB for local data persistence
- **Cloud**: Azure Blob Storage (optional sync)
- **Authentication**: NextAuth.js with OAuth providers
- **Database**: Prisma with SQLite/PostgreSQL
- **PWA**: Workbox + Service Workers
- **Testing**: Vitest + Testing Library

## Code Style & Conventions

### TypeScript Guidelines
- **Strict mode enabled**: Always use strong typing, avoid `any` types
- Use interfaces for object shapes and data structures
- Prefer type inference where clear, explicit types for public APIs
- Use TypeScript's utility types (`Partial`, `Pick`, `Omit`, etc.)

### React Patterns
- Use functional components with hooks (no class components)
- Prefer named exports for components
- Use `useCallback` and `useMemo` for performance optimization
- Keep components focused and single-responsibility
- Extract custom hooks for reusable logic

### File Organization
- Components: `/src/components/` - Reusable UI components
- Pages: `/src/pages/` - Route-level page components
- Utils: `/src/utils/` - Utility functions and helpers
- Lib: `/src/lib/` - Third-party integrations
- Test: `/src/test/` - Test utilities and setup

### Naming Conventions
- **Components**: PascalCase (e.g., `CameraStream.tsx`)
- **Utilities**: camelCase (e.g., `storage.ts`, `cloudSync.ts`)
- **Interfaces**: PascalCase with descriptive names (e.g., `SecurityEvent`, `DetectedObject`)
- **Constants**: UPPER_SNAKE_CASE for true constants

## Security Requirements

### Critical Security Rules
1. **No `any` types**: Security rules enforce `@typescript-eslint/no-explicit-any` as error
2. **Input validation**: Always validate and sanitize user inputs
3. **No eval**: Never use `eval()`, `new Function()`, or similar dangerous constructs
4. **Secrets management**: Never commit secrets, API keys, or tokens to the repository
5. **CSP compliance**: Ensure code works with Content Security Policy headers
6. **Permission handling**: Properly handle camera and microphone permissions

### ESLint Security Rules
The project uses `eslint-plugin-security` with strict enforcement:
- Object injection detection
- Unsafe regex detection
- Child process security
- Non-literal require detection
- Timing attack prevention

### Secure Coding Practices
- Always handle errors gracefully with try-catch blocks
- Use HTTPS for all external communications
- Implement proper cleanup in React effects (return cleanup functions)
- Validate blob data before storage operations
- Use SAS tokens (not permanent keys) for Azure integration

## Development Workflow

### Before Committing Code
1. **Lint**: Run `npm run lint` - Must pass with no errors
2. **Type Check**: Run `npm run type-check` - Must pass
3. **Test**: Run `npm test` - All tests must pass
4. **Security Audit**: Run `npm run security:check` - Address high/critical vulnerabilities
5. **Build**: Run `npm run build` - Ensure production build succeeds

### Testing Requirements
- Write tests for new utilities and business logic
- Use Vitest with Testing Library for component tests
- Mock IndexedDB, MediaDevices, and TensorFlow.js in tests
- See `/src/test/setup.ts` for test configuration

### Build Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm test` - Run test suite

## AI/ML Considerations

### TensorFlow.js Integration
- Models load asynchronously - always handle loading states
- Use `@tensorflow/tfjs-backend-webgl` for GPU acceleration
- Dispose of tensors properly to prevent memory leaks
- Consider performance on different devices

### Object Detection
- COCO-SSD model detects 80 object classes
- Confidence threshold is configurable (default: 0.5)
- Bounding boxes use format: `[x, y, width, height]`
- Detections include: `class`, `confidence`, `bbox`

## Storage & Data Management

### IndexedDB
- Use the `localStorageService` from `/src/utils/storage.ts`
- Always handle async operations with proper error handling
- Initialize database before use to prevent race conditions
- Store blobs efficiently for images and videos

### Cloud Sync
- Optional Azure Blob Storage integration
- Use SAS tokens for authentication (configurable in settings)
- Implement queue-based sync with retry logic
- Handle offline scenarios gracefully

## Component Guidelines

### CameraStream Component
- Request camera permissions explicitly
- Clean up media streams in effect cleanup
- Handle permission denied scenarios
- Support different video resolutions

### DetectionOverlay Component
- Draw bounding boxes on canvas overlay
- Use color coding: Red (people), Orange (vehicles), Green (others)
- Display confidence scores and labels
- Update overlay in sync with video frames

### Settings Management
- Store settings in IndexedDB
- Validate all settings before applying
- Provide sensible defaults
- Allow reset to defaults

## Authentication & Authorization

### OAuth Integration
- Supports Google and GitHub OAuth providers
- Uses NextAuth.js for authentication
- Session management with JWT tokens
- Environment variables required (see `.env.example`)

### User Management
- Store user data in Prisma database
- Hash passwords with bcryptjs (if using credentials)
- Implement proper session validation
- Handle authentication state in React context

## Performance Optimization

### Best Practices
- Use React.memo for expensive components
- Implement lazy loading for routes and heavy components
- Optimize video processing frame rate (not every frame)
- Use web workers for heavy computations when possible
- Minimize re-renders with proper dependency arrays

### Bundle Size
- Keep bundle size minimal - check with `npm run build`
- Use dynamic imports for optional features
- Tree-shake unused code
- Optimize TensorFlow.js model loading

## PWA & Deployment

### Progressive Web App
- Service worker configuration in `vite.config.ts`
- Workbox for caching strategies
- Support offline functionality
- Install prompt for mobile devices

### Deployment Targets
- **Web**: Vercel, Netlify, or static hosting
- **Desktop**: Electron (optional)
- **Mobile**: Capacitor for iOS/Android
- **Azure**: App Service deployment scripts included

## Documentation

### Code Comments
- Document complex algorithms and business logic
- Explain non-obvious TypeScript type definitions
- Add JSDoc comments for public APIs
- Keep comments concise and relevant

### README Updates
- Update feature list when adding new capabilities
- Document new environment variables in `.env.example`
- Update setup instructions for new dependencies
- Keep deployment instructions current

## Troubleshooting Common Issues

### Camera Access
- Ensure HTTPS in production (required for camera API)
- Check browser permissions
- Test on multiple browsers
- Handle permission denied gracefully

### TensorFlow.js Issues
- Wait for `tf.ready()` before model loading
- Check WebGL backend availability
- Handle model loading failures
- Monitor memory usage for tensor leaks

### IndexedDB Issues
- Ensure proper database initialization
- Handle quota exceeded errors
- Implement cleanup for old data
- Test in private/incognito mode

## Additional Resources

- **Security Policy**: See `SECURITY.md` for security guidelines
- **CodeQL**: Automated security scanning configured
- **Dependabot**: Automated dependency updates enabled
- **CODEOWNERS**: Code review assignments configured

## When Helping with This Repository

1. **Prioritize security**: This is a security monitoring app - security is paramount
2. **Maintain type safety**: TypeScript strict mode is non-negotiable
3. **Test thoroughly**: Camera and AI features need careful testing
4. **Consider performance**: Real-time video processing is performance-critical
5. **Handle errors gracefully**: User experience matters, especially for permissions
6. **Document changes**: Update relevant documentation when changing features
7. **Follow conventions**: Maintain consistency with existing code patterns
8. **Think about privacy**: Respect user data and privacy concerns

## Examples of Good Practices

### Error Handling
```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  // Process stream
} catch (error) {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    console.error('Camera permission denied');
    // Show user-friendly message
  } else {
    console.error('Camera access error:', error);
    // Handle other errors
  }
}
```

### TypeScript Interface
```typescript
interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'detection' | 'motion' | 'alert' | 'manual';
  detections: DetectedObject[];
  confidence: number;
  metadata: {
    deviceId: string;
    location?: string;
    cameraId: string;
  };
}
```

### React Component
```typescript
export default function CameraStream({ onDetection }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);
  
  return (/* JSX */);
}
```

---

**Remember**: This application handles security monitoring and user privacy. Every code change should be evaluated through the lens of security, performance, and user trust.
