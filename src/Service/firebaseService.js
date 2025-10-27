// src/Service/firebaseService.js
// Helper functions for signup, login, messaging, and file uploads.

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  addDoc,
  getDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db, storage } from "../firebase";

export async function adminSignup({ name, email, password, teamId }) {
  // Legacy client-side check (keeps for fallback) - not hardened
  const adminsRef = collection(db, "admins");
  const q = query(adminsRef, where("teamId", "==", teamId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error("Team ID already taken. Choose another.");
  }
  // create auth user
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;
  // create admin doc and user profile doc
  const adminDocRef = doc(db, "admins", uid);
  await setDoc(adminDocRef, {
    uid,
    name,
    email,
    teamId,
    createdAt: serverTimestamp(),
  });
  const userProfileRef = doc(db, "users", uid);
  await setDoc(userProfileRef, {
    uid,
    role: "admin",
    teamId,
    adminId: uid,
    name,
    email,
  });
  return { uid, teamId };
}

export async function studentSignup({ name, email, password, teamId }) {
  // find admin by teamId
  const adminsRef = collection(db, "admins");
  const q = query(adminsRef, where("teamId", "==", teamId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error("Invalid team ID. Please contact your admin.");
  }
  const adminDoc = snap.docs[0];
  const adminId = adminDoc.id;
  // create auth user
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;
  // create student record and user profile
  const studentDocRef = doc(db, "students", uid);
  await setDoc(studentDocRef, {
    uid,
    name,
    email,
    adminId,
    teamId,
    createdAt: serverTimestamp(),
  });
  const userProfileRef = doc(db, "users", uid);
  await setDoc(userProfileRef, {
    uid,
    role: "student",
    teamId,
    adminId,
    name,
    email,
  });
  return { uid, adminId, teamId };
}

export async function login({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const userDoc = await getDoc(doc(db, "users", uid));
  return { uid, profile: userDoc.exists() ? userDoc.data() : null };
}

export async function uploadFileForTeam(file, teamId, filename) {
  const path = `teamFiles/${teamId}/${Date.now()}_${filename}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function sendMessage({ senderId, senderRole, teamId, recipientId = null, text = "", file = null }) {
  let fileUrl = null;
  if (file) {
    const upload = await uploadFileForTeam(file, teamId, file.name);
    fileUrl = upload.url;
  }
  const messagesRef = collection(db, "messages");
  const message = {
    senderId,
    senderRole,
    teamId,
    recipientId: recipientId || null,
    text,
    fileUrl: fileUrl || null,
    isPrivate: !!recipientId,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(messagesRef, message);
  return { id: docRef.id, ...message };
}

// New secure admin signup using Cloud Function to atomically reserve teamId
export async function adminSignupSecure({ name, email, password, teamId }) {
  // 1) Create auth user first
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;

  // 2) Call the Cloud Function to atomically reserve teamId and create admin docs
  const functions = getFunctions();
  const createAdminFn = httpsCallable(functions, "createAdminWithTeamId");

  try {
    const res = await createAdminFn({ name, email, uid, teamId });
    return { uid, teamId: res.data.teamId };
  } catch (err) {
    // If function failed (teamId collision etc), delete the created auth user to avoid orphaned auth accounts.
    try {
      await userCred.user.delete();
    } catch (deleteErr) {
      console.warn("Failed to delete orphan auth user:", deleteErr);
    }

    const message = err?.message || "Failed to create admin.";
    throw new Error(message);
  }
}

// Helper to get query for team messages (ordered)
export function fetchTeamMessagesQuery(teamId) {
  return query(collection(db, "messages"), where("teamId", "==", teamId), orderBy("createdAt", "desc"));
}