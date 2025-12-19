package api

import (
	"log"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
)

type loggingResponseWriter struct {
	http.ResponseWriter
	status int
}

func (w *loggingResponseWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

type APIServer struct {
	addr string
}

func NewAPIServer(addr string) *APIServer {
	return &APIServer{
		addr: addr,
	}
}

func (s *APIServer) Run() error {
	router := chi.NewRouter()
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Set-Cookie"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
	}))

	baseRouter := chi.NewRouter()
	router.Mount("/api/v1", baseRouter)

	// lobby manager and routes
	lm := NewLobbyManager()
	baseRouter.Post("/lobbies", lm.CreateLobby)
	baseRouter.Get("/lobbies/{code}", lm.GetLobby)
	baseRouter.Post("/lobbies/{code}/start", lm.StartGame)
	baseRouter.Post("/lobbies/{code}/end", lm.EndGame)
	baseRouter.Post("/lobbies/{code}/restart", lm.RestartGame)
	// websocket endpoint: /api/v1/ws/{code}?name=alice
	baseRouter.Get("/ws/{code}", lm.ServeWS)

	// wrap router with embedded static file handler (serves ui/dist)
	handler := s.serveUI(router)

	log.Println("listening on", s.addr)

	return http.ListenAndServe(s.addr, handler)
}
