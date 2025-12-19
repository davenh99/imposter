package api

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	mRand "math/rand"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/go-chi/chi"
	"github.com/gorilla/websocket"
)

// Minimal lobby + websocket implementation.

type LobbyManager struct {
	mu      sync.Mutex
	lobbies map[string]*Lobby
	logFile *os.File
}

type Lobby struct {
	Code       string            `json:"code"`
	Players    []string          `json:"players"`
	Imposters  int               `json:"imposters"`
	GameState  string            `json:"game_state"` // "waiting", "started", "ended"
	GameWord   string            `json:"game_word"`
	PlayerRole map[string]string // "imposter" or "word"
	CreatedAt  time.Time         `json:"created_at"`
	clients    map[*websocket.Conn]string
	hostConn   *websocket.Conn // separate connection for host
	mu         sync.Mutex
}

type createLobbyResp struct {
	Code string `json:"code"`
}

func NewLobbyManager() *LobbyManager {
	// open or create a log file
	logFile, err := os.OpenFile("lobbies.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Println("failed to open log file:", err)
	}
	lm := &LobbyManager{
		lobbies: make(map[string]*Lobby),
		logFile: logFile,
	}

	// Start cleanup goroutine to remove expired lobbies every minute
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			lm.cleanupExpiredLobbies()
		}
	}()

	return lm
}

func (m *LobbyManager) cleanupExpiredLobbies() {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	expiry := 15 * time.Minute

	for code, lobby := range m.lobbies {
		if now.Sub(lobby.CreatedAt) > expiry {
			// Close all WebSocket connections for this lobby
			lobby.mu.Lock()
			for conn := range lobby.clients {
				conn.Close()
			}
			lobby.mu.Unlock()

			// Remove the lobby
			delete(m.lobbies, code)
			m.logEvent("Lobby expired and removed: %s", code)
		}
	}
}

func (m *LobbyManager) logEvent(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logLine := fmt.Sprintf("[%s] %s\n", timestamp, msg)
	log.Print(logLine)
	if m.logFile != nil {
		m.logFile.WriteString(logLine)
	}
}

func (m *LobbyManager) CreateLobby(w http.ResponseWriter, r *http.Request) {
	code := generateCode(6)
	l := &Lobby{
		Code:       code,
		Players:    []string{},
		Imposters:  0,
		GameState:  "waiting",
		GameWord:   "",
		PlayerRole: make(map[string]string),
		CreatedAt:  time.Now(),
		clients:    make(map[*websocket.Conn]string),
	}

	m.mu.Lock()
	m.lobbies[code] = l
	m.mu.Unlock()

	m.logEvent("Lobby created: %s", code)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(createLobbyResp{Code: code})
}

func (m *LobbyManager) GetLobby(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	m.mu.Lock()
	l, ok := m.lobbies[code]
	m.mu.Unlock()
	if !ok {
		http.Error(w, "lobby not found", http.StatusNotFound)
		return
	}

	l.mu.Lock()
	expiresAt := l.CreatedAt.Add(15 * time.Minute)
	timeRemaining := time.Until(expiresAt)
	resp := struct {
		Code      string    `json:"code"`
		Players   []string  `json:"players"`
		ExpiresIn int64     `json:"expires_in"` // seconds
		ExpiresAt time.Time `json:"expires_at"`
	}{
		Code:      l.Code,
		Players:   append([]string(nil), l.Players...),
		ExpiresIn: int64(timeRemaining.Seconds()),
		ExpiresAt: expiresAt,
	}
	l.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (m *LobbyManager) ServeWS(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	m.mu.Lock()
	l, ok := m.lobbies[code]
	m.mu.Unlock()
	if !ok {
		http.Error(w, "lobby not found", http.StatusNotFound)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("ws upgrade error:", err)
		return
	}

	// Wait for join message with player name. Accept name via query param to avoid race.
	var joinMsg map[string]any
	// If client provided name in query params (e.g., ?name=Host), use that immediately
	if qname := r.URL.Query().Get("name"); qname != "" {
		joinMsg = map[string]any{"type": "join", "name": qname}
	} else {
		if err := conn.ReadJSON(&joinMsg); err != nil {
			log.Println("failed to read join message:", err)
			conn.Close()
			return
		}
	}

	if joinMsg["type"] != "join" {
		conn.WriteJSON(map[string]string{"error": "first message must be join"})
		conn.Close()
		return
	}

	name, ok := joinMsg["name"].(string)
	if !ok || name == "" {
		conn.WriteJSON(map[string]string{"error": "name required"})
		conn.Close()
		return
	}

	// register
	l.mu.Lock()
	isHost := name == "Host"
	if isHost {
		l.hostConn = conn
	} else {
		l.clients[conn] = name
		l.Players = append(l.Players, name)
	}
	// capture current game state/word/role for use below
	currentState := l.GameState
	currentWord := l.GameWord
	// copy role map reference
	roleMap := l.PlayerRole
	l.mu.Unlock()

	if isHost {
		m.logEvent("Host connected to lobby %s", code)
		// Send host confirmation
		_ = conn.WriteJSON(map[string]any{"type": "host_ready", "code": code})
		// Send host the current player list immediately
		m.broadcastLobby(l)
		// If a game is already in progress, notify host with player count
		if currentState == "started" {
			l.mu.Lock()
			count := len(l.Players)
			l.mu.Unlock()
			_ = conn.WriteJSON(map[string]any{"type": "game_started", "code": code, "count": count})
		}
	} else {
		m.logEvent("Player joined lobby %s: %s (total players: %d)", code, name, len(l.Players))
		// If a game is already in progress, send this player their role/word immediately
		if currentState == "started" {
			role := "word"
			if roleMap != nil {
				if r, ok := roleMap[name]; ok {
					role = r
				}
			}
			msg := map[string]any{"type": "game_started", "role": role, "code": code}
			if role == "word" {
				msg["word"] = currentWord
			}
			_ = conn.WriteJSON(msg)
		}
		// broadcast state to all players (so host sees updates and other players)
		m.broadcastLobby(l)
	}

	// read loop
	for {
		var msg map[string]any
		if err := conn.ReadJSON(&msg); err != nil {
			break
		}
		// Handle other message types here if needed
		if t, ok := msg["type"].(string); ok && t == "start" {
			m.broadcastMessage(l, map[string]any{"type": "start_game"})
		}
	}

	// cleanup on disconnect
	l.mu.Lock()
	if isHost {
		l.hostConn = nil
	} else {
		delete(l.clients, conn)
		// remove from Players slice
		for i, p := range l.Players {
			if p == name {
				l.Players = append(l.Players[:i], l.Players[i+1:]...)
				break
			}
		}
	}
	l.mu.Unlock()

	m.broadcastLobby(l)
	conn.Close()
}

func (m *LobbyManager) broadcastLobby(l *Lobby) {
	l.mu.Lock()
	state := map[string]any{"type": "lobby_state", "code": l.Code, "players": append([]string(nil), l.Players...)}
	for c := range l.clients {
		_ = c.WriteJSON(state)
	}
	// Also send to host so they see player updates
	if l.hostConn != nil {
		_ = l.hostConn.WriteJSON(state)
	}
	l.mu.Unlock()
}

func (m *LobbyManager) broadcastMessage(l *Lobby, msg any) {
	l.mu.Lock()
	for c := range l.clients {
		_ = c.WriteJSON(msg)
	}
	l.mu.Unlock()
}

func (m *LobbyManager) StartGame(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	var req struct {
		Imposters int `json:"imposters"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	m.mu.Lock()
	l, ok := m.lobbies[code]
	m.mu.Unlock()
	if !ok {
		http.Error(w, "lobby not found", http.StatusNotFound)
		return
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	// Validate imposters count
	if req.Imposters < 1 || req.Imposters >= len(l.Players) {
		http.Error(w, fmt.Sprintf("imposters must be 1 to %d", len(l.Players)-1), http.StatusBadRequest)
		return
	}

	l.Imposters = req.Imposters
	l.GameState = "started"
	idx, _ := rand.Int(rand.Reader, big.NewInt(int64(len(GameWords))))
	l.GameWord = GameWords[idx.Int64()]
	l.PlayerRole = make(map[string]string)

	// Shuffle players
	mRand.Shuffle(len(l.Players), func(i, j int) {
		l.Players[i], l.Players[j] = l.Players[j], l.Players[i]
	})

	// Assign roles
	impostersNeeded := req.Imposters
	for _, player := range l.Players {
		if impostersNeeded > 0 {
			l.PlayerRole[player] = "imposter"
			impostersNeeded--
		} else {
			l.PlayerRole[player] = "word"
		}
	}

	m.logEvent("Game started in lobby %s with word '%s' and %d imposters", code, l.GameWord, req.Imposters)

	// Broadcast game start with roles to each player
	for c, name := range l.clients {
		role := l.PlayerRole[name]
		msg := map[string]any{
			"type": "game_started",
			"role": role,
			"code": code,
		}
		if role == "word" {
			msg["word"] = l.GameWord
		}
		_ = c.WriteJSON(msg)
	}

	// Send game started notification to host
	if l.hostConn != nil {
		hostMsg := map[string]any{
			"type":  "game_started",
			"code":  code,
			"count": len(l.Players),
		}
		_ = l.hostConn.WriteJSON(hostMsg)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "game started"})
}

// EndGame ends the current game and notifies all clients to return to the lobby
func (m *LobbyManager) EndGame(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	m.mu.Lock()
	l, ok := m.lobbies[code]
	m.mu.Unlock()
	if !ok {
		http.Error(w, "lobby not found", http.StatusNotFound)
		return
	}

	l.mu.Lock()
	l.GameState = "ended"
	l.mu.Unlock()

	m.logEvent("Game ended in lobby %s", code)

	// broadcast game_ended to all players
	msg := map[string]any{"type": "game_ended", "code": code}
	l.mu.Lock()
	for c := range l.clients {
		_ = c.WriteJSON(msg)
	}
	if l.hostConn != nil {
		_ = l.hostConn.WriteJSON(msg)
	}
	l.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "game ended"})
}

// RestartGame assigns a new word and roles and broadcasts a new game_started to all players
func (m *LobbyManager) RestartGame(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	var req struct {
		Imposters int `json:"imposters"`
	}
	// body is optional; if provided we'll use it
	if r.Body != nil {
		// only attempt to decode if there's content
		if r.ContentLength != 0 {
			_ = json.NewDecoder(r.Body).Decode(&req)
		}
	}

	m.mu.Lock()
	l, ok := m.lobbies[code]
	m.mu.Unlock()
	if !ok {
		http.Error(w, "lobby not found", http.StatusNotFound)
		return
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	// determine imposters count to use
	imposters := req.Imposters
	if imposters <= 0 {
		imposters = l.Imposters
	}
	if imposters < 1 || imposters >= len(l.Players) {
		http.Error(w, fmt.Sprintf("imposters must be 1 to %d", len(l.Players)-1), http.StatusBadRequest)
		return
	}

	l.Imposters = imposters
	l.GameState = "started"
	idx, _ := rand.Int(rand.Reader, big.NewInt(int64(len(GameWords))))
	l.GameWord = GameWords[idx.Int64()]
	l.PlayerRole = make(map[string]string)

	// Assign roles randomly (simple prefix assign; could be improved)
	impostersNeeded := imposters
	for _, player := range l.Players {
		if impostersNeeded > 0 {
			l.PlayerRole[player] = "imposter"
			impostersNeeded--
		} else {
			l.PlayerRole[player] = "word"
		}
	}

	m.logEvent("Game restarted in lobby %s with word '%s' and %d imposters", code, l.GameWord, imposters)

	// Broadcast game start with roles to each player
	for c, name := range l.clients {
		role := l.PlayerRole[name]
		msg := map[string]any{
			"type": "game_started",
			"role": role,
			"code": code,
		}
		if role == "word" {
			msg["word"] = l.GameWord
		}
		_ = c.WriteJSON(msg)
	}

	// Send game started notification to host
	if l.hostConn != nil {
		hostMsg := map[string]any{
			"type":  "game_started",
			"code":  code,
			"count": len(l.Players),
		}
		_ = l.hostConn.WriteJSON(hostMsg)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "game restarted"})
}

func generateCode(n int) string {
	letters := "abcdefghijklmnopqrstuvwxyz"
	out := make([]byte, n)
	for i := 0; i < n; i++ {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
		out[i] = letters[num.Int64()]
	}
	return string(out)
}
