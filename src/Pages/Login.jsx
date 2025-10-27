import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      const uid = cred.user.uid;
      const userSnap = await getDoc(doc(db, "users", uid));
      const profile = userSnap.exists() ? userSnap.data() : null;
      if (profile?.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input required type="email" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white" />
        <input required type="password" placeholder="Password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white" />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-yellow-500 rounded">{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      {error && <p className="text-red-500 mt-3">{error}</p>}
      <div className="mt-4 text-sm text-gray-400">
        <p>Don't have an account?</p>
        <div className="flex space-x-2 mt-2">
          <a href="/admin-signup" className="text-yellow-400">Admin signup</a>
          <a href="/student-signup" className="text-yellow-400">Student signup</a>
        </div>
      </div>
    </div>
  );
}