package backend

import "embed"

// FrontendFS holds the embedded frontend static files.
//
//go:embed all:frontend_dist
var FrontendFS embed.FS

// PrototypeFS holds the embedded MVP prototype static files.
//
//go:embed all:prototype_dist
var PrototypeFS embed.FS
