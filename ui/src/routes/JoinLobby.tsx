import { createSignal, onCleanup, onMount } from "solid-js";
import { useParams, useNavigate, useLocation } from "@solidjs/router";
import { GameButton } from "../components/GameButton";

export default function JoinLobby() {
  const params = useParams();
  const loc = useLocation();
  const nav = useNavigate();
  const code = params.code;
  const name = new URLSearchParams(loc.search).get("name") || "Player";
  const [players, setPlayers] = createSignal<string[]>([]);
  const [isLeaving, setIsLeaving] = createSignal(false);

  let ws: WebSocket | null = null;

  function wsUrl() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${location.host}/api/v1/ws/${code}`;
  }

  function leaveLobby() {
    setIsLeaving(true);
    if (ws) {
      ws.close();
    }
    nav("/");
  }

  onMount(async () => {
    // Check if lobby exists
    try {
      const res = await fetch(`/api/v1/lobbies/${code}`);
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
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "lobby_state") {
          setPlayers(msg.players || []);
        }
        if (msg.type === "game_started") {
          console.log("Game started, navigating to game room");
          nav(`/game/${code}`);
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    };

    // Send join message with player name
    ws.onopen = () => {
      ws?.send(JSON.stringify({ type: "join", name: name }));
    };
  });

  onCleanup(() => {
    if (ws) ws.close();
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Joined Lobby</h2>
          <p class="text-gray-500 text-sm">Waiting for the host to start the game...</p>
        </div>

        <div class="bg-gray-100 rounded-lg p-6 mb-6">
          <p class="text-gray-600 text-sm mb-2">Lobby Code:</p>
          <p class="text-3xl font-bold text-purple-600 text-center tracking-wider">{code}</p>
        </div>

        <div class="mb-6">
          <p class="text-gray-700 font-semibold mb-3">
            Players in lobby: <span class="text-purple-600">{players().length}</span>
          </p>
          <div class="space-y-2 min-h-12">
            {players().length === 0 ? (
              <span class="text-gray-400 text-sm">Connecting...</span>
            ) : (
              players().map((p) => (
                <span class="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                  {p}
                </span>
              ))
            )}
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-blue-700 text-sm">
            ✓ Successfully joined the lobby. Waiting for the game to start...
          </p>
        </div>

        <GameButton onClick={leaveLobby} disabled={isLeaving()} variant="secondary" class="w-full">
          {isLeaving() ? "Leaving..." : "Leave Lobby"}
        </GameButton>
      </div>
    </div>
  );
}
