package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi"
	"github.com/gorilla/websocket"
)

// Helper function to create a test router
func setupTestRouter() *chi.Mux {
	router := chi.NewRouter()
	baseRouter := chi.NewRouter()
	lm := NewLobbyManager()
	baseRouter.Post("/lobbies", lm.CreateLobby)
	baseRouter.Get("/lobbies/{code}", lm.GetLobby)
	baseRouter.Post("/lobbies/{code}/start", lm.StartGame)
	baseRouter.Get("/ws/{code}", lm.ServeWS)
	router.Mount("/api/v1", baseRouter)
	return router
}

// TestCreateLobby tests creating a new lobby
func TestCreateLobby(t *testing.T) {
	router := setupTestRouter()
	req, err := http.NewRequest("POST", "/api/v1/lobbies", nil)
	if err != nil {
		t.Fatal(err)
	}
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var resp createLobbyResp
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal("failed to decode response:", err)
	}

	if resp.Code == "" {
		t.Fatal("expected non-empty code")
	}

	if len(resp.Code) != 6 {
		t.Fatalf("expected code length 6, got %d", len(resp.Code))
	}

	t.Logf("✓ Created lobby with code: %s", resp.Code)
}

// TestGetLobby tests getting a lobby
func TestGetLobby(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("POST", "/api/v1/lobbies", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Create a lobby first
	var createResp createLobbyResp
	json.NewDecoder(w.Body).Decode(&createResp)
	code := createResp.Code

	// Now get the lobby
	req, _ = http.NewRequest("GET", "/api/v1/lobbies/"+code, nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var getLobbyResp struct {
		Code      string   `json:"code"`
		Players   []string `json:"players"`
		ExpiresIn int64    `json:"expires_in"`
	}

	if err := json.NewDecoder(w.Body).Decode(&getLobbyResp); err != nil {
		t.Fatal("failed to decode response:", err)
	}

	if getLobbyResp.Code != code {
		t.Fatalf("expected code %s, got %s", code, getLobbyResp.Code)
	}

	if getLobbyResp.Players != nil && len(getLobbyResp.Players) > 0 {
		t.Fatalf("expected no players initially, got %v", getLobbyResp.Players)
	}

	t.Logf("✓ Retrieved lobby %s with %d players and %d seconds until expiry",
		code, len(getLobbyResp.Players), getLobbyResp.ExpiresIn)
}

// TestGetLobbyNotFound tests getting a non-existent lobby
func TestGetLobbyNotFound(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("GET", "/api/v1/lobbies/invalid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", w.Code)
	}

	t.Log("✓ Invalid lobby returns 404")
}

// TestPlayerJoinFlow tests a player joining a lobby via WebSocket
func TestPlayerJoinFlow(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("POST", "/api/v1/lobbies", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Create a lobby
	var createResp createLobbyResp
	json.NewDecoder(w.Body).Decode(&createResp)
	code := createResp.Code

	// Connect to WebSocket
	server := httptest.NewServer(router)
	defer server.Close()
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/api/v1/ws/" + code

	ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatal("failed to connect to WebSocket:", err)
	}
	defer ws.Close()

	// Send join message
	joinMsg := map[string]string{"type": "join", "name": "TestPlayer"}
	if err := ws.WriteJSON(joinMsg); err != nil {
		t.Fatal("failed to send join message:", err)
	}

	// Receive lobby_state message
	var msg map[string]interface{}
	if err := ws.ReadJSON(&msg); err != nil {
		t.Fatal("failed to receive message:", err)
	}

	if msg["type"] != "lobby_state" {
		t.Fatalf("expected lobby_state message, got %v", msg["type"])
	}

	players := msg["players"].([]interface{})
	if len(players) != 1 {
		t.Fatalf("expected 1 player, got %d", len(players))
	}

	if players[0] != "TestPlayer" {
		t.Fatalf("expected player name 'TestPlayer', got %v", players[0])
	}

	t.Logf("✓ Player successfully joined lobby with name: %s", players[0])
}

// TestInvalidJoinMessage tests that invalid join messages are rejected
func TestInvalidJoinMessage(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("POST", "/api/v1/lobbies", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Create a lobby
	var createResp createLobbyResp
	json.NewDecoder(w.Body).Decode(&createResp)
	code := createResp.Code

	server := httptest.NewServer(router)
	defer server.Close()
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/api/v1/ws/" + code

	ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatal("failed to connect to WebSocket:", err)
	}
	defer ws.Close()

	// Send invalid message (not a join message)
	invalidMsg := map[string]string{"type": "invalid"}
	if err := ws.WriteJSON(invalidMsg); err != nil {
		t.Fatal("failed to send message:", err)
	}

	// Should receive an error message
	var msg map[string]interface{}
	if err := ws.ReadJSON(&msg); err != nil {
		t.Fatal("failed to receive message:", err)
	}

	if msg["error"] == nil {
		t.Fatalf("expected error message for invalid join, got %v", msg)
	}

	t.Log("✓ Invalid join message properly rejected")
}

// TestMultiplePlayersJoin tests multiple players joining a lobby
func TestMultiplePlayersJoin(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("POST", "/api/v1/lobbies", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Create a lobby
	var createResp createLobbyResp
	json.NewDecoder(w.Body).Decode(&createResp)
	code := createResp.Code

	server := httptest.NewServer(router)
	defer server.Close()
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/api/v1/ws/" + code

	// Player 1 joins
	ws1, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatal("failed to connect player 1:", err)
	}
	defer ws1.Close()

	ws1.WriteJSON(map[string]string{"type": "join", "name": "Player1"})
	var msg1 map[string]interface{}
	ws1.ReadJSON(&msg1) // Receive lobby_state

	// Player 2 joins
	ws2, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatal("failed to connect player 2:", err)
	}
	defer ws2.Close()

	ws2.WriteJSON(map[string]string{"type": "join", "name": "Player2"})
	var msg2 map[string]interface{}
	ws2.ReadJSON(&msg2) // Receive lobby_state

	// Verify both received broadcasts with correct player counts
	if len(msg2["players"].([]interface{})) != 2 {
		t.Fatalf("expected 2 players after both joined, got %d", len(msg2["players"].([]interface{})))
	}

	// Player 1 should also receive the broadcast with 2 players
	var msg1Updated map[string]interface{}
	ws1.ReadJSON(&msg1Updated)
	players1Updated := msg1Updated["players"].([]interface{})
	if len(players1Updated) != 2 {
		t.Fatalf("expected player 1 to see 2 players after player 2 joined, got %d", len(players1Updated))
	}

	players2 := msg2["players"].([]interface{})
	t.Logf("✓ Multiple players joined: %v", players2)
}

// TestStartGameFlow tests the complete game start flow
func TestStartGameFlow(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("POST", "/api/v1/lobbies", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Create a lobby
	var createResp createLobbyResp
	json.NewDecoder(w.Body).Decode(&createResp)
	code := createResp.Code

	server := httptest.NewServer(router)
	defer server.Close()
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/api/v1/ws/" + code

	// Multiple players join
	connections := []*websocket.Conn{}
	for i := 1; i <= 3; i++ {
		ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		if err != nil {
			t.Fatalf("failed to connect player %d: %v", i, err)
		}

		ws.WriteJSON(map[string]string{"type": "join", "name": "Player" + string(rune('0'+i))})
		// Drain the lobby_state message
		var msg map[string]interface{}
		ws.ReadJSON(&msg)

		connections = append(connections, ws)
	}

	// Start the game with 1 imposter
	defer func() {
		for _, ws := range connections {
			ws.Close()
		}
	}()

	body := bytes.NewBufferString(`{"imposters": 1}`)
	req, _ = http.NewRequest("POST", "/api/v1/lobbies/"+code+"/start", body)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 for start game, got %d", w.Code)
	}

	// Verify all players receive game_started message
	gameStartedCount := 0
	for _, ws := range connections {
		var msg map[string]interface{}

		// First message might be lobby_state update, skip until we get game_started
		for {
			if err := ws.ReadJSON(&msg); err != nil {
				t.Fatalf("failed to receive game_started message: %v", err)
			}
			if msg["type"] == "game_started" {
				break
			}
		}

		role, ok := msg["role"].(string)
		if !ok || (role != "imposter" && role != "word") {
			t.Fatalf("expected role to be 'imposter' or 'word', got %v", msg["role"])
		}

		if role == "word" {
			word, ok := msg["word"].(string)
			if !ok || word == "" {
				t.Fatalf("expected word in message for word role, got %v", msg["word"])
			}
		}

		t.Logf("✓ Player received game_started with role: %s", role)

		if role == "imposter" {
			gameStartedCount++
		}
	}

	if gameStartedCount != 1 {
		t.Fatalf("expected 1 imposter, got %d", gameStartedCount)
	}

	t.Log("✓ Game started successfully with proper role assignment")
}

// TestStartGameInvalidImposters tests validation of imposter count
func TestStartGameInvalidImposters(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("POST", "/api/v1/lobbies", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Create a lobby
	var createResp createLobbyResp
	json.NewDecoder(w.Body).Decode(&createResp)
	code := createResp.Code

	// Try to start game with too many imposters (more than players)
	body := bytes.NewBufferString(`{"imposters": 5}`)
	req, _ = http.NewRequest("POST", "/api/v1/lobbies/"+code+"/start", body)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for invalid imposters, got %d", w.Code)
	}

	t.Log("✓ Invalid imposter count properly rejected")
}

// TestLobbyExpiry tests that lobbies track creation time
func TestLobbyExpiry(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("POST", "/api/v1/lobbies", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Create a lobby
	var createResp createLobbyResp
	json.NewDecoder(w.Body).Decode(&createResp)
	code := createResp.Code

	// Get the lobby and check expiry
	req, _ = http.NewRequest("GET", "/api/v1/lobbies/"+code, nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var getLobbyResp struct {
		Code      string `json:"code"`
		ExpiresIn int64  `json:"expires_in"`
	}

	json.NewDecoder(w.Body).Decode(&getLobbyResp)

	// Should be close to 900 seconds (15 minutes)
	if getLobbyResp.ExpiresIn < 890 || getLobbyResp.ExpiresIn > 900 {
		t.Fatalf("expected expires_in around 900 seconds, got %d", getLobbyResp.ExpiresIn)
	}

	t.Logf("✓ Lobby expiry tracking works: %d seconds remaining", getLobbyResp.ExpiresIn)
}

// TestCompleteGameFlow is an end-to-end test of the full game flow
func TestCompleteGameFlow(t *testing.T) {
	router := setupTestRouter()

	// Step 1: Host creates a lobby
	req, _ := http.NewRequest("POST", "/api/v1/lobbies", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var createResp createLobbyResp
	json.NewDecoder(w.Body).Decode(&createResp)
	code := createResp.Code
	t.Logf("Step 1: Created lobby %s", code)

	server := httptest.NewServer(router)
	defer server.Close()
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/api/v1/ws/" + code

	// Step 2: Host connects to lobby
	hostWS, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatal("host failed to connect:", err)
	}
	defer hostWS.Close()

	hostWS.WriteJSON(map[string]string{"type": "join", "name": "Host"})
	var hostMsg map[string]interface{}
	hostWS.ReadJSON(&hostMsg)

	// Host should receive host_ready message
	if hostMsg["type"] != "host_ready" {
		t.Fatalf("expected host_ready, got %v", hostMsg["type"])
	}

	t.Log("Step 2: Host connected to lobby")

	// Step 3: Players join
	playerWSs := []*websocket.Conn{}
	for i := 1; i <= 3; i++ {
		ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		if err != nil {
			t.Fatalf("failed to connect player %d: %v", i, err)
		}

		playerName := "Player" + string(rune('0'+i))
		ws.WriteJSON(map[string]string{"type": "join", "name": playerName})
		playerWSs = append(playerWSs, ws)

		var msg map[string]interface{}
		ws.ReadJSON(&msg)
	}

	defer func() {
		for _, ws := range playerWSs {
			ws.Close()
		}
	}()

	t.Log("Step 3: 3 players joined the lobby")

	// Step 4: Host starts game with 1 imposter
	body := bytes.NewBufferString(`{"imposters": 1}`)
	req, _ = http.NewRequest("POST", "/api/v1/lobbies/"+code+"/start", body)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("failed to start game: %d", w.Code)
	}

	t.Log("Step 4: Game started")

	// Step 5: Verify all players received game_started
	impostersCount := 0
	for i, ws := range playerWSs {
		var msg map[string]interface{}

		// Skip any non-game_started messages
		for {
			if err := ws.ReadJSON(&msg); err != nil {
				t.Fatalf("player %d failed to read message: %v", i+1, err)
			}
			if msg["type"] == "game_started" {
				break
			}
		}

		role := msg["role"].(string)

		t.Logf("  Player %d role: %s", i+1, role)

		if role == "imposter" {
			impostersCount++
		}
	}

	// Host also receives game_started
	var hostMsg2 map[string]interface{}
	for {
		if err := hostWS.ReadJSON(&hostMsg2); err != nil {
			t.Fatalf("failed to read host message: %v", err)
		}
		if hostMsg2["type"] == "game_started" {
			break
		}
	}

	// Host should receive game_started notification without role
	hostCount, ok := hostMsg2["count"].(float64)
	if !ok {
		t.Fatalf("expected count in host message, got %v", hostMsg2["count"])
	}
	t.Logf("  Host received game_started with %d players", int(hostCount))

	if impostersCount != 1 {
		t.Fatalf("expected 1 imposter among players, got %d", impostersCount)
	}

	t.Log("✓ Complete game flow successful!")
}
