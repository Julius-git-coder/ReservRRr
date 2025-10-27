import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { sendMessage } from "../Service/firebaseService";

export default function AdminDashboard() {
  const [adminProfile, setAdminProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    (async () => {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        setAdminProfile(data);
        fetchStudents(data.adminId);
      }
    })();
  }, []);

  async function fetchStudents(adminId) {
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("adminId", "==", adminId), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function handleSend(e) {
    e?.preventDefault();
    if (!adminProfile) return;
    try {
      await sendMessage({
        senderId: adminProfile.uid,
        senderRole: "admin",
        teamId: adminProfile.teamId,
        recipientId: selectedStudentId || null,
        text: messageText,
        file,
      });
      setMessageText("");
      setFile(null);
      alert("Message sent");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Admin Dashboard</h2>
      {adminProfile && <p className="mt-2">Team: <b>{adminProfile.teamId}</b> — Students: {students.length}</p>}
      <div className="mt-4 max-w-lg">
        <form onSubmit={handleSend} className="space-y-3">
          <select value={selectedStudentId} onChange={(e)=>setSelectedStudentId(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white">
            <option value="">Broadcast to all students</option>
            {students.map(s => <option key={s.uid} value={s.uid}>{s.name} ({s.email})</option>)}
          </select>
          <textarea required value={messageText} onChange={(e)=>setMessageText(e.target.value)} placeholder="Type message..." className="w-full p-2 rounded bg-gray-800 text-white" />
          <input type="file" onChange={(e)=>setFile(e.target.files[0] || null)} className="w-full text-sm text-gray-300" />
          <button type="submit" className="px-4 py-2 bg-yellow-500 rounded">Send</button>
        </form>
      </div>
    </div>
  );
}