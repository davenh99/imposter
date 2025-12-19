package api

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed staticdist/**
var uiFiles embed.FS

func (s *APIServer) serveUI(router http.Handler) http.Handler {
	fsys, _ := fs.Sub(uiFiles, "staticdist")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// API passthrough
		if strings.HasPrefix(r.URL.Path, "/api/") {
			router.ServeHTTP(w, r)
			return
		}

		// Normalize path
		p := strings.TrimPrefix(r.URL.Path, "/")
		if p == "" {
			p = "index.html"
		}

		// Serve file if it exists and is not a directory
		if info, err := fs.Stat(fsys, p); err == nil && !info.IsDir() {
			http.ServeFileFS(w, r, fsys, p)
			return
		}

		// SPA fallback
		http.ServeFileFS(w, r, fsys, "index.html")
	})
}
