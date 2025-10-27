import React, { useState } from "react";
import { studentSignup } from "../Service/firebaseService";

export default function StudentSignup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", teamId: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await studentSignup(form);
      setSuccess("Signup successful! You are part of team: " + res.teamId);
    } catch (err) {
      setError(err.message || "Signup failed.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Student Signup</h2>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <input required placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white" />
        <input required placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white" />
        <input required placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white" />
        <input required placeholder="Team ID (provided by admin)" value={form.teamId} onChange={(e)=>setForm({...form,teamId:e.target.value.trim()})} className="w-full p-2 rounded bg-gray-800 text-white" />
        <button type="submit" className="px-4 py-2 bg-yellow-500 rounded">Sign Up</button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-600 mt-2">{success}</p>}
    </div>
  );
}