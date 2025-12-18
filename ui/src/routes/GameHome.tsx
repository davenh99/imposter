import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { GameButton } from "../components/GameButton";
import { GameInput } from "../components/GameInput";

export default function GameHome() {
  const [code, setCode] = createSignal("");
  const [codeError, setCodeError] = createSignal("");
  const [isCreating, setIsCreating] = createSignal(false);
  const [isJoining, setIsJoining] = createSignal(false);
  const nav = useNavigate();

  async function createLobby() {
    setIsCreating(true);
    try {
      const res = await fetch(`/api/v1/lobbies`, { method: "POST" });
      if (!res.ok) {
        console.error("Failed to create lobby");
        return;
      }
      const data = await res.json();
      console.log("Lobby created with code:", data.code);
      nav(`/lobby/${data.code}`);
    } catch (err) {
      console.error("Error creating lobby:", err);
    } finally {
      setIsCreating(false);
    }
  }

  async function joinLobby() {
    setCodeError("");

    if (!code().trim()) {
      setCodeError("Please enter a lobby code");
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/v1/lobbies/${code().toLowerCase()}`);
      if (!res.ok) {
        setCodeError("Lobby code not found. Please check and try again.");
        return;
      }
      console.log("Joining lobby:", code());
      nav(`/join/${code().toLowerCase()}`);
    } catch (err) {
      console.error("Error joining lobby:", err);
      setCodeError("Error joining lobby. Please try again.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 class="text-4xl font-bold text-center mb-2 text-gray-800">Imposter</h1>
        <p class="text-center text-gray-500 mb-8 text-sm">Play the word guessing game</p>

        <GameButton onClick={createLobby} disabled={isCreating()} class="w-full mb-6">
          {isCreating() ? "Creating..." : "Create Lobby"}
        </GameButton>

        <div class="flex items-center gap-3 mb-6">
          <div class="flex-1 h-px bg-gray-300"></div>
          <span class="text-gray-500 text-sm">or</span>
          <div class="flex-1 h-px bg-gray-300"></div>
        </div>

        <div class="space-y-3">
          <GameInput
            value={code()}
            onInput={(val) => setCode(val.toUpperCase())}
            label="Join Lobby"
            placeholder="Enter code"
            error={codeError()}
            maxlength={6}
          />
          <GameButton onClick={joinLobby} variant="secondary" disabled={isJoining()} class="w-full">
            {isJoining() ? "Joining..." : "Join"}
          </GameButton>
        </div>
      </div>
    </div>
  );
}
