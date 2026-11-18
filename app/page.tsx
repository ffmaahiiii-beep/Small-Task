
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Task = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  reward_usd: number;
};

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [balance, setBalance] = useState(0);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("binance");
const [paymentAccount, setPaymentAccount] = useState("");
const [withdrawAmount, setWithdrawAmount] = useState("0.50");
  const [proof, setProof] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDashboard(id: string) {
    if (!supabase) return;

    const { data: taskData } = await supabase
      .from("tasks")
      .select("id,title,description,instructions,category,reward_usd")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    const { data: walletData } = await supabase
      .from("wallets")
      .select("balance_usd")
      .eq("user_id", id)
      .maybeSingle();

    setTasks(taskData || []);
    setBalance(Number(walletData?.balance_usd || 0));
  }

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        setUserId(data.session.user.id);
        loadDashboard(data.session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) {
          setUserId(session?.user.id || "");
          if (session?.user.id) loadDashboard(session.user.id);
        }
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleAuth(e: React.FormEvent<HTMLFormElement>) {
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
        setMessage("Registration হয়েছে। Email confirmation করুন।");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Login successful!");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  async function submitTask() {
    if (!supabase || !userId || !selectedTask || !proof.trim()) {
      setMessage("Task নির্বাচন করে Proof লিখুন।");
      return;
    }

    setLoading(true);
let uploadedPath: string | null = null;

if (proofFile) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(proofFile.type)) {
    setMessage("শুধু JPG, PNG অথবা WEBP ছবি দিন");
    setLoading(false);
    return;
  }

  if (proofFile.size > 5 * 1024 * 1024) {
    setMessage("ছবির সাইজ 10 MB-এর কম হতে হবে");
    setLoading(false);
    return;
  }

  const path = `${userId}/${crypto.randomUUID()}.${proofFile.name.split(".").pop()}`;

  const { error: uploadError } = await supabase.storage
    .from("task-proofs")
    .upload(path, proofFile, {
      contentType: proofFile.type,
      upsert: false,
    });

  if (uploadError) {
    setMessage(uploadError.message);
    setLoading(false);
    return;
  }

  uploadedPath = path;
}
    const { error } = await supabase.from("submissions").insert({
      task_id: selectedTask,
      user_id: userId,
      proof_text: proof.trim(),
      proof_url: uploadedPath,
      status: "pending",
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("আপনার কাজ জমা হয়েছে। Admin review করবেন।");
      setProof("");
      setSelectedTask("");
    }

    setLoading(false);
  }
async function submitWithdrawal() {
  if (!supabase || !userId) return;

  const amount = Number(withdrawAmount);

  if (!Number.isFinite(amount) || amount < 0.50) {
    setMessage("Minimum withdrawal is $0.50");
    return;
  }

  if (amount > balance) {
    setMessage("Insufficient wallet balance");
    return;
  }

  if (!paymentAccount.trim()) {
    setMessage("Payment account দিন");
    return;
  }

  setLoading(true);

  const { error } = await supabase.from("withdrawals").insert({
    user_id: userId,
    amount_usd: amount,
    payment_method: paymentMethod,
    payment_account: paymentAccount.trim(),
    status: "pending",
  });

  if (error) {
    setMessage(error.message);
  } else {
    setMessage("Withdrawal request জমা হয়েছে!");
    setPaymentAccount("");
    setWithdrawAmount("0.50");
  }

  setLoading(false);
}
  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserId("");
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 p-7">
          <h1 className="text-3xl font-bold text-center text-emerald-400">
            Small Task
          </h1>
          <p className="text-center text-slate-400 mt-2">
            Complete tasks and earn rewards
          </p>

          <div className="flex gap-2 mt-8">
            <button onClick={() => setMode("signup")} className="flex-1 rounded-lg bg-emerald-500 p-3 text-black">
              Register
            </button>
            <button onClick={() => setMode("login")} className="flex-1 rounded-lg bg-slate-700 p-3">
              Login
            </button>
          </div>

          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-lg bg-slate-800 p-3"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg bg-slate-800 p-3"
            />
            <button disabled={loading} className="w-full rounded-lg bg-emerald-500 p-3 font-bold text-black">
              {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
            </button>
          </form>

          {message && <p className="mt-4 break-words text-center text-sm">{message}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-5">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-emerald-400">Small Task</h1>
          <button onClick={logout} className="rounded-lg bg-red-600 px-4 py-2">
            Logout
          </button>
        </header>

        <section className="mt-6 rounded-2xl bg-slate-900 p-6">
          <p className="text-slate-400">Wallet Balance</p>
          <h2 className="mt-2 text-4xl font-bold text-emerald-400">
            {selectedTask.instructions && (
  <div className="mt-4 rounded-lg bg-blue-900/30 p-4">
    <h3 className="font-bold text-blue-300">
      Screenshot Instructions
    </h3>
    <p className="mt-2 whitespace-pre-line text-sm">
      {selectedTask.instructions}
    </p>
  </div>
)}
            ${balance.toFixed(2)}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Minimum withdrawal: $0.50
          </p>
        </section>

        <h2 className="mt-8 text-2xl font-bold">Available Tasks</h2>

        {tasks.length === 0 && (
          <p className="mt-4 text-slate-400">এখনো কোনো Published Task নেই।</p>
        )}

        {tasks.map((task) => (
          <article key={task.id} className="mt-4 rounded-xl bg-slate-900 p-5">
            <h3 className="text-xl font-bold">{task.title}</h3>
            <p className="mt-2 text-slate-300">{task.description}</p>
            <p className="mt-2 text-sm text-slate-400">{task.instructions}</p>
            <p className="mt-3 font-bold text-emerald-400">
              Reward: ${Number(task.reward_usd).toFixed(2)}
            </p>
            <button
              onClick={() => setSelectedTask(task.id)}
              className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-black"
            >
              Submit this task
            </button>
          </article>
        ))}

        {selectedTask && (
          <section className="mt-6 rounded-xl bg-slate-900 p-5">
            <h2 className="text-xl font-bold">Submit Your Proof</h2>
            <textarea
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="আপনার কাজের প্রমাণ লিখুন"
              className="mt-4 min-h-28 w-full rounded-lg bg-slate-800 p-3"
            />
            <div className="mt-3">
  <label className="mb-2 block text-sm text-slate-300">
    Screenshot দিন (ঐচ্ছিক)
  </label>
  <input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
    className="w-full rounded-lg bg-slate-800 p-3 text-sm"
  />
  <p className="mt-1 text-xs text-slate-400">
    JPG, PNG অথবা WEBP — সর্বোচ্চ 5 MB
  </p>
</div>
            <button
              onClick={submitTask}
              disabled={loading}
              className="mt-3 rounded-lg bg-emerald-500 px-5 py-3 font-bold text-black"
            >
              Submit Proof
            </button>
          </section>
        )}

        {message && (
          <p className="mt-5 break-words rounded-lg bg-slate-800 p-3 text-center">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
