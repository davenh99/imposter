import { useNavigate } from "@solidjs/router";

export default function NotFound() {
  const nav = useNavigate();
  return (
    <div class="min-h-screen bg-cover bg-[url(/img/46840.jpg)] flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p class="text-gray-600 mb-6">The page you were looking for doesn't exist.</p>
        <button
          onClick={() => nav("/")}
          class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
