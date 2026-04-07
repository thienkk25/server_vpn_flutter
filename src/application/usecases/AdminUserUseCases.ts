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

  async createUser(data: { email: string, password?: string, displayName?: string, isPremium?: boolean }): Promise<any> {
    if (!admin.apps.length) throw new Error("Firebase not initialized");
    
    // 1. Create Auth User
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });

    // 2. Handle Premium Subscription if true
    if (data.isPremium) {
      await admin.firestore().collection('subscriptions').doc(userRecord.uid).set({
        userId: userRecord.uid,
        isPremium: true,
        expiredAt: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10, // 10 years mock
      });
    }

    return { uid: userRecord.uid };
  }

  async updateUser(uid: string, data: { email?: string, password?: string, displayName?: string, isPremium?: boolean }): Promise<boolean> {
    if (!admin.apps.length) throw new Error("Firebase not initialized");
    
    // 1. Update Auth User
    const updatePayload: any = {};
    if (data.email) updatePayload.email = data.email;
    // Don't update password if it's empty string
    if (data.password && data.password.trim() !== '') {
      updatePayload.password = data.password;
    }
    if (data.displayName !== undefined) updatePayload.displayName = data.displayName;

    if (Object.keys(updatePayload).length > 0) {
      await admin.auth().updateUser(uid, updatePayload);
    }

    // 2. Handle Premium Subscription
    if (data.isPremium !== undefined) {
      const subRef = admin.firestore().collection('subscriptions').doc(uid);
      if (data.isPremium) {
        await subRef.set({
          userId: uid,
          isPremium: true,
          expiredAt: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10, // 10 years mock
        }, { merge: true });
      } else {
        await subRef.delete().catch(() => {});
      }
    }

    return true;
  }
}
