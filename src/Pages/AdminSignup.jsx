import React, { useState } from "react";
import { adminSignupSecure } from "../Service/firebaseService";
import { useNavigate } from "react-router-dom";

export default function AdminSignup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", teamId: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminSignupSecure(form);
      setSuccess(`Admin created. Team ID: ${res.teamId}`);
      // user is signed in after createUserWithEmailAndPassword -> redirect to admin dashboard
      navigate("/admin-dashboard");
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Admin Signup</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input required placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white" />
        <input required placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white" />
        <input required placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white" />
        <input required placeholder="Team ID (unique, share with students)" value={form.teamId} onChange={(e)=>setForm({...form,teamId:e.target.value.trim()})} className="w-full p-2 rounded bg-gray-800 text-white" />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-yellow-500 rounded">{loading ? "Creating..." : "Create Admin"}</button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-600 mt-2">{success}</p>}
    </div>
  );
}