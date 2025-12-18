import { createSignal, onCleanup, onMount } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { GameButton } from "../components/GameButton";

export default function GameRoom() {
  const params = useParams();
  const nav = useNavigate();
  const code = params.code;
  const [role, setRole] = createSignal<string | null>(null);
  const [word, setWord] = createSignal<string | null>(null);

  let ws: WebSocket | null = null;

  function wsUrl() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${location.host}/api/v1/ws/${code}`;
  }

  function endGame() {
    nav("/");
  }

  onMount(() => {
    ws = new WebSocket(wsUrl());
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "game_started") {
          console.log("Game started, role:", msg.role, "word:", msg.word);
          setRole(msg.role);
          if (msg.role === "word") {
            setWord(msg.word);
          }
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
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Game</h2>
        </div>

        {role() === null ? (
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

        <GameButton onClick={endGame} class="w-full">
          End Game
        </GameButton>
      </div>
    </div>
  );
}
