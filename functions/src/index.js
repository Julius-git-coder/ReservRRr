const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.createAdminWithTeamId = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }

  const { name, email, uid, teamId } = data || {};

  if (!name || !email || !uid || !teamId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
  }

  const normalizedTeamId = String(teamId).trim();

  const teamDocRef = db.collection("teamIds").doc(normalizedTeamId);
  const adminDocRef = db.collection("admins").doc(uid);
  const userDocRef = db.collection("users").doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const teamSnap = await tx.get(teamDocRef);
      if (teamSnap.exists) {
        throw new functions.https.HttpsError("already-exists", "Team ID already taken. Choose another.");
      }

      tx.set(teamDocRef, {
        adminId: uid,
        reservedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(adminDocRef, {
        uid,
        name,
        email,
        teamId: normalizedTeamId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(userDocRef, {
        uid,
        role: "admin",
        teamId: normalizedTeamId,
        adminId: uid,
        name,
        email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { success: true, teamId: normalizedTeamId };
  } catch (err) {
    if (err instanceof functions.https.HttpsError) {
      throw err;
    }
    console.error("createAdminWithTeamId error:", err);
    throw new functions.https.HttpsError("internal", "Failed to create admin. Try again.");
  }
});
