# Copilot Repository Instructions

## Project Overview
AI-powered **security monitoring application** using real-time object detection on camera feeds. React/TypeScript frontend with TensorFlow.js, IndexedDB storage, Azure cloud sync, and NextAuth.js authentication.

## Architecture Pattern
**3-layer local-first with cloud sync:**
- **Detection Layer**: COCO-SSD model via TensorFlow.js running in browser
- **Storage Layer**: IndexedDB for local persistence with priority-based sync queue
- **Sync Layer**: Azure Blob Storage with SAS token authentication

## Tech Stack & Key Dependencies
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **AI/ML**: TensorFlow.js + COCO-SSD model (`@tensorflow-models/coco-ssd`)
- **Camera**: WebRTC Media APIs with Canvas overlay system for detection visualization
- **Storage**: IndexedDB (via `idb`) for local-first data persistence
- **Cloud**: Azure Blob Storage with SAS token authentication (no server required)
- **Auth**: NextAuth.js with Google/GitHub OAuth + Prisma adapter
- **PWA**: Vite PWA plugin with Workbox for offline functionality

## Critical Patterns

### Camera + Detection Flow
1. **Initialization**: Load COCO-SSD model, start camera stream, create overlay canvas
2. **Detection Loop**: `requestAnimationFrame` → detect objects → draw overlays → save events
3. **Media Capture**: Combine video + overlay canvas for recordings with visual annotations
4. **Auto-cleanup**: Stop tracks properly to avoid camera access lingering

### Storage & Sync Architecture
- **Local-first**: All events saved to IndexedDB immediately, app works offline
- **Sync Queue**: Priority-based queue (`high` for people, `medium` for vehicles)
- **Blob Strategy**: Images/videos stored separately from JSON metadata
- **Rate Limiting**: 3-second cooldown between saved events to prevent spam

### File Structure Conventions
```
src/
├── components/           # React components
├── utils/
│   ├── storage.ts       # IndexedDB service (events, settings, sync queue)
│   ├── cloudSync.ts     # Azure Blob operations 
│   ├── syncQueue.ts     # Background sync orchestrator
│   ├── yolo.ts          # COCO-SSD model wrapper
│   └── deviceAdapters.ts # Camera/device abstraction
├── pages/api/           # NextAuth.js API routes
└── lib/                 # Auth, Prisma, Stripe utilities
```

## Development Commands
```bash
npm run dev                    # Vite dev server
npm run dev:https             # HTTPS for camera testing
npm run serve:iphone          # Mobile testing on port 3000
npm run security:check        # ESLint security rules + audit
npm run build && npm run preview  # Production build testing
```

## Common Tasks

### Adding New Object Detection Classes
1. Update `securityRelevantClasses` array in `CameraStream.tsx`
2. Add color coding in `drawDetections()` function 
3. Update priority logic in `storage.ts` `getEventPriority()`

### Camera/Canvas Integration
- Always use `requestAnimationFrame` for detection loops
- Ensure overlay canvas matches video dimensions dynamically
- Stop camera tracks in cleanup: `stream.getTracks().forEach(track => track.stop())`
- Use `MediaRecorder` with combined video+overlay stream for annotated recordings

### Azure Blob Configuration
- Test with `cloudSyncService.testConnection()` - provides specific CORS/permissions debugging
- SAS tokens need: `Read, Write, Delete, List` permissions
- Container must exist and have CORS configured for web origins

### Authentication Setup
- OAuth apps need redirect URIs: `http://localhost:3001/api/auth/callback/{provider}`
- NextAuth requires `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- Prisma models support multi-tenant isolation via `userId` field

## Security Guardrails
- **No API keys** in frontend code - use SAS tokens with expiration
- **Local-first data** - app should work fully offline, sync is enhancement
- **Media privacy** - never log blob contents, only metadata
- **Rate limiting** - prevent detection spam via cooldown timers

## Common Gotchas
- **CORS**: Azure Storage needs CORS rules for web access (`*` origins, all methods)
- **Canvas overlay**: Must redraw on every frame, clear previous drawings
- **IndexedDB timing**: Always `await initialize()` before database operations
- **HTTPS required**: Camera access requires HTTPS in production (use `dev:https`)
- **Model loading**: Handle COCO-SSD load failures gracefully with mock detection fallback
