import { createSignal, onCleanup, onMount } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { GameButton } from "../components/GameButton";
import { GameInput } from "../components/GameInput";
import { getApiUrl, getWebSocketUrl } from "../config/api";
import QRCodeStyling from "qr-code-styling";

export default function Lobby() {
  const params = useParams();
  const nav = useNavigate();
  const code = params.code;
  const [players, setPlayers] = createSignal<string[]>([]);
  const [imposters, setImposters] = createSignal("");
  const [imposterError, setImposterError] = createSignal("");
  const [isStarting, setIsStarting] = createSignal(false);
  const [expiresIn, setExpiresIn] = createSignal<number | null>(null);
  const apiUrl = getApiUrl();
  let qrContainer: HTMLDivElement | undefined;

  let ws: WebSocket | null = null;
  let expiryInterval: ReturnType<typeof setInterval> | null = null;

  function wsUrl() {
    return getWebSocketUrl(`/api/v1/ws/${code}`);
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
      const res = await fetch(`${apiUrl}/api/v1/lobbies/${code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imposters: imposterCount }),
      });

      if (!res.ok) {
        setImposterError("Failed to start game. Please try again.");
        return;
      }

      console.log("Game started");
      nav(`/game/${code}?name=Host`);
    } catch (err) {
      console.error("Error starting game:", err);
      setImposterError("Error starting game. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  onMount(async () => {
    // Check if lobby exists and get expiry time
    try {
      const res = await fetch(`${apiUrl}/api/v1/lobbies/${code}`);
      if (!res.ok) {
        console.error("Lobby not found, redirecting to home");
        nav("/");
        return;
      }
      const data = await res.json();
      setExpiresIn(data.expires_in);
    } catch (err) {
      console.error("Error checking lobby:", err);
      nav("/");
      return;
    }

    // Update expiry countdown every second
    expiryInterval = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(expiryInterval!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Generate QR code
    const qrCode = new QRCodeStyling({
      width: 200,
      height: 200,
      data: `${window.location.origin}/?code=${code}`,
      image: "",
      dotsOptions: {
        color: "#000000",
        type: "rounded",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
      },
    });

    if (qrContainer) {
      qrContainer.innerHTML = "";
      qrCode.append(qrContainer);
    }

    ws = new WebSocket(wsUrl());

    ws.onopen = () => {
      console.log("Lobby WebSocket opened, sending host join message");
      // Host needs to send a join message to be registered as a client
      ws?.send(JSON.stringify({ type: "join", name: "Host" }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        console.log("Lobby received message:", msg);
        if (msg.type === "host_ready") {
          console.log("Host connection ready");
          // Host is ready, just confirm connection
        }
        if (msg.type === "lobby_state") {
          console.log("Updating lobby players:", msg.players);
          setPlayers(msg.players || []);
        }
        if (msg.type === "game_started") {
          console.log("Game started via WebSocket");
          // ensure host remains identified when navigating to game room
          nav(`/game/${code}?name=Host`);
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    };

    ws.onerror = (ev) => {
      console.error("WebSocket error in Lobby:", ev);
    };

    ws.onclose = () => {
      console.log("WebSocket closed in Lobby");
    };
  });

  onCleanup(() => {
    if (ws) ws.close();
    if (expiryInterval) clearInterval(expiryInterval);
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Lobby</h2>
          <p class="text-gray-500 text-sm">You are the host</p>
          {expiresIn() !== null && (
            <p class="text-xs text-amber-600 mt-2 font-semibold">
              Server expiring in {Math.max(0, expiresIn()!)}s
            </p>
          )}
        </div>

        <div class="bg-gray-100 rounded-lg p-6 mb-6">
          <p class="text-gray-600 text-sm mb-2">Share this code with friends:</p>
          <p class="text-4xl font-bold text-blue-600 text-center tracking-wider">{code}</p>
        </div>

        <div class="bg-white border-2 border-gray-300 rounded-lg p-4 mb-6 flex justify-center">
          <div ref={qrContainer} class="flex justify-center items-center" />
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
