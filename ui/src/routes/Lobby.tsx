import { createSignal, onCleanup, onMount } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { GameButton } from "../components/GameButton";
import { GameInput } from "../components/GameInput";

export default function Lobby() {
  const params = useParams();
  const nav = useNavigate();
  const code = params.code;
  const [players, setPlayers] = createSignal<string[]>([]);
  const [imposters, setImposters] = createSignal("");
  const [imposterError, setImposterError] = createSignal("");
  const [isStarting, setIsStarting] = createSignal(false);

  let ws: WebSocket | null = null;

  function wsUrl() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${location.host}/api/v1/ws/${code}`;
  }

  async function startGame() {
    setImposterError("");

    const playerCount = players().length;
    const imposterCount = parseInt(imposters(), 10);

    if (!imposters().trim()) {
      setImposterError("Please enter number of imposters");
      return;
    }

    if (isNaN(imposterCount) || imposterCount < 1 || imposterCount >= playerCount) {
      setImposterError(`Must have 1 to ${Math.max(1, playerCount - 1)} imposters for ${playerCount} players`);
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch(`/api/v1/lobbies/${code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imposters: imposterCount }),
      });

      if (!res.ok) {
        setImposterError("Failed to start game. Please try again.");
        return;
      }

      console.log("Game started");
      nav(`/game/${code}`);
    } catch (err) {
      console.error("Error starting game:", err);
      setImposterError("Error starting game. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  onMount(() => {
    ws = new WebSocket(wsUrl());
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "lobby_state") {
          setPlayers(msg.players || []);
        }
        if (msg.type === "game_started") {
          console.log("Game started via WebSocket");
          nav(`/game/${code}`);
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    };
  });

  onCleanup(() => {
    if (ws) ws.close();
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Lobby</h2>
          <p class="text-gray-500 text-sm">You are the host</p>
        </div>

        <div class="bg-gray-100 rounded-lg p-6 mb-6">
          <p class="text-gray-600 text-sm mb-2">Share this code with friends:</p>
          <p class="text-4xl font-bold text-blue-600 text-center tracking-wider">{code}</p>
        </div>

        <div class="mb-6">
          <p class="text-gray-700 font-semibold mb-3">
            Players in lobby: <span class="text-blue-600">{players().length}</span>
          </p>
          <div class="space-y-2 min-h-12">
            {players().length === 0 ? (
              <span class="text-gray-400 text-sm">Waiting for players to join...</span>
            ) : (
              players().map((p) => (
                <span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                  {p}
                </span>
              ))
            )}
          </div>
        </div>

        <div class="mb-6">
          <GameInput
            value={imposters()}
            onInput={setImposters}
            label="Number of Imposters"
            placeholder="1"
            type="number"
            error={imposterError()}
          />
          {players().length > 0 && (
            <p class="text-xs text-gray-500 mt-2">
              Max: {Math.max(1, players().length - 1)} for {players().length} player
              {players().length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <GameButton onClick={startGame} disabled={isStarting() || players().length === 0} class="w-full">
          {isStarting() ? "Starting..." : "Start Game"}
        </GameButton>
      </div>
    </div>
  );
}
