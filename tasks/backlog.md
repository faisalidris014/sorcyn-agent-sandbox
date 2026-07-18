# Backlog

## TICKET-001: Add a /health endpoint
**Scope:** src/routes/ (new file only)
**Screenshot route:** null

Add a GET /health endpoint that returns 200 with JSON:
{ "status": "ok", "uptime": <process uptime in seconds> }

Acceptance criteria:
- Endpoint responds 200
- Response includes status and uptime fields
- A test covers the 200 response
- No existing files modified except route registration
