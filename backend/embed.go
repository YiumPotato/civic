package backend

import "embed"

// FrontendFS holds the embedded frontend static files.
// At build time, the frontend/dist directory must be present at the module root.
// Typically: cd ../frontend && npm run build && cp -r dist ../backend/frontend_dist
//
//go:embed all:frontend_dist
var FrontendFS embed.FS
