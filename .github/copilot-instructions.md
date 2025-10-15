# Copilot Repository Instructions

## Project goals
- Open, secure camera-AI platform with **clinic mode** (encounters → transcript → clinical note → 837D claim).
- Monorepo layout: `apps/`, `services/`, `packages/`, `infra/`, `docs/`.

## Tech & structure (current)
- Node 20+, npm workspaces.
- Apps: `apps/clinic-web` (React/Vite).
- Services: `services/ingest-func` (Azure Functions Durable).
- Packages: `@aurelian/capture`, `@aurelian/thermal`, `@aurelian/recorder`.
- Infra: `infra/bicep` (dev stack).

## Guardrails
- **No secrets** in code or PRs; prefer Key Vault in PROD.
- Treat transcripts/notes as sensitive; don’t log unless `PHI_ENABLED=true`.
- Use `npm run -ws … --if-present` for workspace scripts.

## Coding preferences
- TypeScript strict; ESM where possible.
- Small pure functions; orchestrators must be **deterministic** (Durable Functions).
- Prefer `requestAnimationFrame` for rendering loops; stop camera tracks on teardown.

## Common tasks Copilot should help with
- Create PR-sized scaffolds (apps/services/packages) with npm workspaces.
- Add CI jobs for build/test/type-check using `-ws`.
- Add Azure Functions activities with **callActivityWithRetry** and typed inputs/outputs.
- Generate 837D (demo) builders, tests, and CLI usage.
- Infrastructure Bicep for dev (public), and a separate prod profile (private endpoints, MI, KV).

## File map hints
- UI: `apps/clinic-web/src/**/*`
- Functions: `services/ingest-func/src/**/*`
- Packages: `packages/*/src/**/*`
- Infra: `infra/bicep/**/*`
- Docs: `docs/**/*`

## PR etiquette
- Follow **Conventional Commits**.
- Keep PRs focused; include minimal docs and tests.
- Don’t introduce new secrets, telemetry keys, or PII samples.

## Ready responses Copilot can draft
- **Why `-ws` in CI?** Runs across all workspaces; prevents silent gaps.
- **Why drop `--legacy-peer-deps`?** Hides real conflicts; only use with a documented reason.
- **Why PHI guard?** Public repo ≠ HIPAA; enable only in hardened deployments.
