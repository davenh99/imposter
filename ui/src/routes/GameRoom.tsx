import { createSignal, onCleanup, onMount } from "solid-js";
import { useParams, useNavigate, useLocation } from "@solidjs/router";
import { GameButton } from "../components/GameButton";
import { getApiUrl, getWebSocketUrl } from "../config/api";

export default function GameRoom() {
  const params = useParams();
  const loc = useLocation();
  const nav = useNavigate();
  const code = params.code;
  const name = new URLSearchParams(loc.search).get("name") || "Player";
  const isHost = name === "Host";
  // Allow pre-filled role/word via query params when navigating from JoinLobby
  const roleParam = new URLSearchParams(loc.search).get("role");
  const wordParam = new URLSearchParams(loc.search).get("word");
  const [role, setRole] = createSignal<string | null>(roleParam || null);
  const [word, setWord] = createSignal<string | null>(wordParam || null);
  const apiUrl = getApiUrl();

  let ws: WebSocket | null = null;

  function wsUrl() {
    return getWebSocketUrl(`/api/v1/ws/${code}`);
  }

  function endGame() {
    nav("/");
  }

  onMount(async () => {
    // Check if lobby exists
    try {
      const res = await fetch(`${apiUrl}/api/v1/lobbies/${code}`);
      if (!res.ok) {
        console.error("Lobby not found, redirecting to home");
        nav("/");
        return;
      }
    } catch (err) {
      console.error("Error checking lobby:", err);
      nav("/");
      return;
    }

    ws = new WebSocket(wsUrl());

    ws.onopen = () => {
      console.log("GameRoom WebSocket opened, sending join message");
      // Send join message to register this connection
      ws?.send(JSON.stringify({ type: "join", name: name }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        console.log("GameRoom received message:", msg);
        if (msg.type === "game_started") {
          console.log("Game started, role:", msg.role, "word:", msg.word);
          // If we already populated role/word from query params, prefer that; otherwise set from server
          if (!role()) {
            setRole(msg.role);
          }
          if (!word() && msg.word) {
            setWord(msg.word);
          }
        }
        // Ignore lobby_state messages in game room
        if (msg.type === "lobby_state") {
          console.log("Ignoring lobby_state in game room");
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    };

    ws.onerror = (ev) => {
      console.error("WebSocket error in GameRoom:", ev);
    };

    ws.onclose = () => {
      console.log("WebSocket closed in GameRoom");
    };
  });

  onCleanup(() => {
    if (ws) ws.close();
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Game</h2>
        </div>

        {isHost ? (
          // Host screen (show host UI immediately, regardless of role/word)
          <div class="text-center">
            <div class="text-6xl font-bold text-yellow-600 mb-4">👑</div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Game In Progress</h3>
            <p class="text-gray-600 mb-8">
              The players are playing. The imposter is trying to guess the word.
            </p>
            <GameButton onClick={endGame} class="w-full bg-red-600 hover:bg-red-700">
              End Game
            </GameButton>
          </div>
        ) : role() === null ? (
          <div class="text-center text-gray-500 py-8">
            <p>Loading game...</p>
          </div>
        ) : role() === "imposter" ? (
          <div class="text-center">
            <div class="text-6xl font-bold text-red-600 mb-4">🎭</div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">You are the Imposter!</h3>
            <p class="text-gray-600 mb-8">
              Your goal is to figure out what the word is by asking questions and listening to the other
              players.
            </p>
          </div>
        ) : (
          <div class="text-center">
            <div class="text-6xl font-bold text-green-600 mb-4">✓</div>
            <h3 class="text-xl font-bold text-gray-800 mb-4">The Word Is:</h3>
            <div class="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-8 mb-8">
              <p class="text-4xl font-bold text-blue-600">{word()}</p>
            </div>
            <p class="text-gray-600">Don't let the imposter figure this out!</p>
          </div>
        )}
      </div>
    </div>
  );
}
