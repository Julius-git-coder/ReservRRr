import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    (async () => {
      const snap = await getDoc(doc(db, "students", uid));
      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        const userSnap = await getDoc(doc(db, "users", uid));
        setProfile(userSnap.exists() ? userSnap.data() : null);
      }
    })();
  }, []);

  if (!profile) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="p-6 max-w-md">
      <h2 className="text-xl font-bold">Profile</h2>
      <p className="mt-2"><strong>Name:</strong> {profile.name}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Team ID:</strong> {profile.teamId}</p>
      <p><strong>Admin ID:</strong> {profile.adminId}</p>
    </div>
  );
}