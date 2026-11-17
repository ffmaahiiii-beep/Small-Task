
"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase connection পাওয়া যায়নি।");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        setMessage(
          "Registration successful! Email check করে confirmation link-এ চাপ দিন।"
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        setMessage("Login successful! আপনার account তৈরি হয়েছে।");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-7 shadow-xl">
        <h1 className="text-3xl font-bold text-center text-emerald-400">
          Small Task
        </h1>
        <p className="text-center text-slate-400 mt-2">
          Complete tasks and earn rewards
        </p>

        <div className="flex gap-2 mt-8">
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
            className={`flex-1 rounded-lg p-3 ${mode === "signup" ? "bg-emerald-500 text-black" : "bg-slate-800"}`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className={`flex-1 rounded-lg p-3 ${mode === "login" ? "bg-emerald-500 text-black" : "bg-slate-800"}`}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block mb-2">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg bg-slate-800 p-3 outline-none"
            />
          </div>

          <div>
            <label className="block mb-2">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg bg-slate-800 p-3 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 p-3 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
          </button>
        </form>

        {message && (
          <p className="mt-5 rounded-lg bg-slate-800 p-3 text-center text-sm break-words">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Small Task · USD Rewards
        </p>
      </div>
    </main>
  );
}
