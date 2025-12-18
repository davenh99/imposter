package api

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"path"
	"strings"
)

//go:embed staticdist/**
var uiFiles embed.FS

// serveUI mounts an embedded SPA (built into ui/dist) onto the provided router.
func (s *APIServer) serveUI(router http.Handler) http.Handler {
	// create a sub FS rooted at ui/dist
	sub, err := fs.Sub(uiFiles, "staticdist")
	if err != nil {
		log.Println("embedded ui dist not found in staticdist:", err)
		return router
	}

	fileServer := http.FileServer(http.FS(sub))

	// return handler that first checks for /api path, otherwise serves static files
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If request is to API, forward to router
		if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/api_v1/") || strings.HasPrefix(r.URL.Path, "/api-v1/") {
			router.ServeHTTP(w, r)
			return
		}

		// If path is root or requesting a static asset, check if file exists.
		p := path.Clean(r.URL.Path)
		if p == "/" {
			// serve embedded index.html via fileServer
			r2 := r.Clone(r.Context())
			r2.URL.Path = "/index.html"
			fileServer.ServeHTTP(w, r2)
			return
		}

		// Attempt to stat the file in the embedded FS
		name := strings.TrimPrefix(p, "/")
		if _, err := fs.Stat(sub, name); err == nil {
			fileServer.ServeHTTP(w, r)
			return
		}

		// Fallback to embedded index.html for SPA routes
		r2 := r.Clone(r.Context())
		r2.URL.Path = "/index.html"
		fileServer.ServeHTTP(w, r2)
		return
	})
}
