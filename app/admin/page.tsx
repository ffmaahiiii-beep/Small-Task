
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

type Submission = {
  id: string;
  proof_text: string;
  proof_url: string | null;
  created_at: string;
  status: string;
  tasks: {
    title: string;
    reward_usd: number;
  } | null;
};

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState("General");
  const [reward, setReward] = useState("0.50");
  const [slots, setSlots] = useState("10");

  async function loadSubmissions() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("submissions")
      .select("id,proof_text,proof_url,created_at,status,tasks(title,reward_usd)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setSubmissions((data || []) as unknown as Submission[]);
  }

  useEffect(() => {
    async function checkAdmin() {
      if (!supabase) {
        setMessage("Supabase connection পাওয়া যায়নি।");
        setChecking(false);
        return;
      }

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setMessage("প্রথমে Login করুন।");
        setChecking(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (error || profile?.role !== "admin") {
        setMessage("আপনার Admin permission নেই।");
        setChecking(false);
        return;
      }

      setIsAdmin(true);
      await loadSubmissions();
      setChecking(false);
    }

    checkAdmin();
  }, []);

  async function createTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!supabase) return;

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setMessage("আবার Login করুন।");
      return;
    }

    const { error } = await supabase.from("tasks").insert({
      title,
      description,
      instructions,
      category,
      reward_usd: Number(reward),
      slots_total: Number(slots),
      created_by: data.user.id,
      status: "published",
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Task সফলভাবে Publish হয়েছে!");
      setTitle("");
      setDescription("");
      setInstructions("");
      setReward("0.50");
      setSlots("10");
    }
  }

  
async function reviewTask(id: string, status: "approved" | "rejected") {
  if (!supabase) return;

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    setMessage("আবার Login করুন।");
    return;
  }

  let error;

  if (status === "approved") {
    const result = await supabase.rpc("approve_task_submission", {
      p_submission_id: id,
    });
    error = result.error;
  } else {
    const result = await supabase
      .from("submissions")
      .update({
        status: "rejected",
        reviewed_by: data.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending");

    error = result.error;
  }

  if (error) {
    setMessage(error.message);
  } else {
    setMessage(
      status === "approved"
        ? "Approved! Reward Wallet-এ যোগ হয়েছে।"
        : "Submission rejected হয়েছে।"
    );
    await loadSubmissions();
  }
}


  if (checking) {
    return <main className="min-h-screen bg-slate-950 p-6 text-white">Checking Admin...</main>;
  }

  if (!isAdmin) {
    return <main className="min-h-screen bg-slate-950 p-6 text-white">{message}</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-emerald-400">
          Small Task Admin
        </h1>
        <p className="mt-2 text-slate-400">Private Admin Panel</p>

        <section className="mt-8 rounded-xl bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-bold">Create New Task</h2>

          <form onSubmit={createTask} className="space-y-3">
            <input required value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title" className="w-full rounded-lg bg-slate-800 p-3" />

            <textarea required value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description" className="w-full rounded-lg bg-slate-800 p-3" />

            <textarea required value={instructions} onChange={(e) => setInstructions(e.target.value)}
              placeholder="Task instructions" className="w-full rounded-lg bg-slate-800 p-3" />

            <input required value={category} onChange={(e) => setCategory(e.target.value)}
              placeholder="Category" className="w-full rounded-lg bg-slate-800 p-3" />

            <label className="block text-sm text-slate-300">Reward (USD)</label>
            <input required type="number" min="0.01" step="0.01" value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="w-full rounded-lg bg-slate-800 p-3" />

            <label className="block text-sm text-slate-300">Available slots</label>
            <input required type="number" min="1" step="1" value={slots}
              onChange={(e) => setSlots(e.target.value)}
              className="w-full rounded-lg bg-slate-800 p-3" />

            <button className="w-full rounded-lg bg-emerald-500 p-3 font-bold text-black">
              Publish Task
            </button>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Pending Submissions</h2>

          {submissions.length === 0 && (
            <p className="mt-4 text-slate-400">এখনো কোনো Pending Submission নেই।</p>
          )}

          {submissions.map((item) => (
            <article key={item.id} className="mt-4 rounded-xl bg-slate-900 p-5">
              <h3 className="text-lg font-bold">{item.tasks?.title || "Task"}</h3>
              <p className="mt-2 text-slate-300">{item.proof_text}</p>

              {item.proof_url && (
                <a href={item.proof_url} target="_blank" rel="noreferrer"
                  className="mt-2 block text-emerald-400 underline">
                  View Proof Link
                </a>
              )}

              <div className="mt-4 flex gap-3">
                <button onClick={() => reviewTask(item.id, "approved")}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-bold">
                  Approve
                </button>
                <button onClick={() => reviewTask(item.id, "rejected")}
                  className="rounded-lg bg-red-600 px-4 py-2 font-bold">
                  Reject
                </button>
              </div>
            </article>
          ))}
        </section>

        {message && (
          <p className="mt-5 break-words rounded-lg bg-slate-800 p-3">{message}</p>
        )}
      </div>
    </main>
  );
}
