import * as admin from 'firebase-admin';

export class AdminUserUseCases {
  async getAllUsers(): Promise<any[]> {
    if (!admin.apps.length) return [];
    
    // 1. Fetch Users from Firebase Auth
    const listUsersResult = await admin.auth().listUsers(200);
    const users = listUsersResult.users.map(u => ({
      uid: u.uid,
      email: u.email || 'N/A',
      displayName: u.displayName || 'Unnamed',
      creationTime: u.metadata.creationTime,
      lastSignInTime: u.metadata.lastSignInTime,
      isPremium: false,
    }));

    // 2. Fetch Premium status from Firestore (subscriptions)
    const db = admin.firestore();
    const subsSnapshot = await db.collection('subscriptions').where('isPremium', '==', true).get();
    
    const premiumUids = new Set<string>();
    subsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Ensure the subscription hasn't expired
      if (!data.expiredAt || Date.now() < data.expiredAt) {
        premiumUids.add(doc.id); // Assuming doc ID is user ID, or lookup data.userId
        if (data.userId) premiumUids.add(data.userId);
      }
    });

    // 3. Merge data
    return users.map(u => ({
      ...u,
      isPremium: premiumUids.has(u.uid)
    }));
  }

  async deleteUser(uid: string): Promise<boolean> {
    if (!admin.apps.length) throw new Error("Firebase not initialized");
    await admin.auth().deleteUser(uid);
    // Optional: Delete user's active subscription if any
    await admin.firestore().collection('subscriptions').doc(uid).delete().catch(() => {});
    return true;
  }
}
