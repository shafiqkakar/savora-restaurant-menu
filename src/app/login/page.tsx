
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#151512] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md bg-[#22221e] border border-[#bda477]/30 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-[#c6aa79] tracking-[5px] text-sm mb-3">
            SAVORA
          </p>

          <h1 className="text-3xl text-[#f5efe3] font-serif">
            Admin Login
          </h1>

          <p className="text-gray-400 text-sm mt-3">
            Sign in to manage your restaurant menu.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[#e9dfce] text-sm mb-2">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              className="w-full rounded-lg bg-[#151512] border border-[#bda477]/30 px-4 py-3 text-white outline-none focus:border-[#c6aa79]"
            />
          </div>

          <div>
            <label className="block text-[#e9dfce] text-sm mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full rounded-lg bg-[#151512] border border-[#bda477]/30 px-4 py-3 pr-20 text-white outline-none focus:border-[#c6aa79]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c6aa79] text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c6aa79] text-[#171713] py-3 rounded-lg font-semibold hover:bg-[#ddc397] transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login to Dashboard"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-8">
          SAVORA Restaurant Management
        </p>
      </div>
    </main>
  );
}
