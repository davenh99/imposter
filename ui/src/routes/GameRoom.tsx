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
  const [playerCount, setPlayerCount] = createSignal(0);
  const [wordBadVotes, setWordBadVotes] = createSignal(0);

  let ws: WebSocket | null = null;

  function wsUrl() {
    return getWebSocketUrl(`/api/v1/ws/${code}`);
  }

  function endGame() {
    // tell server to end the game and return players to lobby
    fetch(`${apiUrl}/api/v1/lobbies/${code}/end`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("failed to end game");
        // navigate host back to lobby
        nav(`/lobby/${code}?name=Host`);
      })
      .catch((err) => {
        console.error("End game failed:", err);
        // still navigate back as a fallback
        nav(`/lobby/${code}?name=Host`);
      });
  }

  function newGame() {
    // request server to restart the game in this lobby (reuse existing imposter count)
    fetch(`${apiUrl}/api/v1/lobbies/${code}/restart`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("failed to restart game");
        // host stays in game room; players will get new game_started messages
        console.log("Game restarted");
      })
      .catch((err) => {
        console.error("Restart game failed:", err);
      });
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

    // include our name in the websocket URL to ensure server registers us immediately
    ws = new WebSocket(wsUrl() + `?name=${encodeURIComponent(name)}`);

    ws.onopen = () => {
      console.log("GameRoom WebSocket opened, sending join message");
      // registration via query param ensures server knows our name; no extra join needed
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        console.log("GameRoom received message:", msg);
        if (msg.type === "game_ended") {
          console.log("Game ended, navigating back to lobby/join");
          // Host should return to lobby view; players should go to the join view
          if (isHost) {
            nav(`/lobby/${code}?name=Host`);
          } else {
            nav(`/join/${code}?name=${encodeURIComponent(name)}`);
          }
          return;
        }
        if (msg.type === "game_started") {
          console.log("Game started (or restarted), role:", msg.role, "word:", msg.word);
          // Always update role/word on game_started so a restart takes effect for connected players
          setRole(msg.role || null);
          if (msg.word) {
            setWord(msg.word);
          } else {
            setWord(null);
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
    <div class="min-h-screen bg-cover bg-[url(/img/46840.jpg)] flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Game</h2>
        </div>

        {isHost ? (
          // Host screen (show host UI immediately, regardless of role/word)
          <div class="text-center">
            <div class="text-6xl font-bold text-yellow-600 mb-4">🤓</div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Game In Progress</h3>
            <p class="text-gray-600 mb-8">who da imposter ඞ</p>
            <div>
              <h4>Does the word suck ?? 😲</h4>
              <div class="text-4xl font-bold text-blue-600 mb-4">
                {wordBadVotes()}/{playerCount()}
              </div>
            </div>
            <div class="flex gap-3">
              <GameButton onClick={endGame} class="flex-1 bg-red-600 hover:bg-red-700">
                End Game
              </GameButton>
              <GameButton onClick={newGame} variant="secondary" class="flex-1">
                New Game
              </GameButton>
            </div>
          </div>
        ) : role() === null ? (
          <div class="text-center text-gray-500 py-8">
            <p>Loading game...</p>
          </div>
        ) : role() === "imposter" ? (
          <div class="text-center">
            {/* <div class="text-6xl font-bold text-red-600 mb-4">🎭</div> */}
            <img src="/img/hamster.svg" alt="Imposter" class="mx-auto mb-4 w-50 h-50" />
            <h3 class="text-2xl font-bold text-gray-800 mb-4">You are the Imposter!</h3>
            <p class="text-gray-600 mb-8">Don't get found out!!!! 😳</p>
          </div>
        ) : (
          <div class="text-center">
            <div class="text-6xl font-bold text-green-600 mb-4">✓</div>
            <h3 class="text-xl font-bold text-gray-800 mb-4">The Word Is:</h3>
            <div class="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-8 mb-8">
              <p class="text-4xl font-bold text-blue-600">{word()}</p>
            </div>
            <p class="text-gray-600">Don't let the imposter figure this out!</p>
            <p>Does the word suck?</p>
            <GameButton
              onClick={() => {
                // vote that the word is bad
              }}
            >
              Hell yeah
            </GameButton>
            <GameButton
              onClick={() => {
                // remove word is bad vote
              }}
            >
              Nah, it's ok
            </GameButton>
          </div>
        )}
      </div>
    </div>
  );
}
