import * as admin from 'firebase-admin';

export class AdminBackupRestoreUseCases {
  async exportData(): Promise<any> {
    if (!admin.apps.length) throw new Error("Firebase not initialized");
    const db = admin.firestore();

    const serversSnapshot = await db.collection('vpn_servers').get();
    const servers = serversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const subsSnapshot = await db.collection('subscriptions').get();
    const subscriptions = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const settingsSnapshot = await db.collection('app_settings').get();
    const settings = settingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: "1.0",
      },
      data: {
        vpn_servers: servers,
        subscriptions: subscriptions,
        app_settings: settings,
      }
    };
  }

  async importData(backupPayload: any): Promise<void> {
    if (!admin.apps.length) throw new Error("Firebase not initialized");
    const db = admin.firestore();

    const { data } = backupPayload;
    if (!data) throw new Error("Invalid backup payload format");

    let currentBatch = db.batch();
    let count = 0;

    const collections = [
        { name: 'vpn_servers', items: data.vpn_servers },
        { name: 'subscriptions', items: data.subscriptions },
        { name: 'app_settings', items: data.app_settings }
    ];

    for (const col of collections) {
        if (!Array.isArray(col.items)) continue;
        for (const item of col.items) {
            if (!item.id) continue;
            const docRef = db.collection(col.name).doc(item.id.toString());
            const payload = { ...item };
            delete payload.id;
            
            // For vpn_servers, we might need ID inside the document as well
            if (col.name === 'vpn_servers') {
               payload.id = item.id;
            }

            currentBatch.set(docRef, payload, { merge: true });
            count++;

            // Firestore transaction/batch limit is 500 operations
            if (count === 500) {
                await currentBatch.commit();
                currentBatch = db.batch();
                count = 0;
            }
        }
    }

    if (count > 0) {
        await currentBatch.commit();
    }
  }
}
