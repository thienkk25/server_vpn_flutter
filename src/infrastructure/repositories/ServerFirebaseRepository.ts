import { IServerRepository } from '../../domain/repositories/IServerRepository';
import { ServerEntity } from '../../domain/entities/ServerEntity';
import { db } from '../config/firebase';

export class ServerFirebaseRepository implements IServerRepository {
  private collectionName = 'vpn_servers';

  async getAllServers(): Promise<ServerEntity[]> {
    const firestoreDb = db;
    if (!firestoreDb) {
      console.warn("Returning empty array because Firebase DB is not initialized.");
      return [];
    }

    try {
      console.log("Firestore DB initialized, fetching vpn_servers...");
      const snapshot = await firestoreDb.collection(this.collectionName).get();
      console.log(`Fetched snapshot, empty: ${snapshot.empty}, size: ${snapshot.size}`);
      const servers: ServerEntity[] = [];

      if (snapshot.empty) {
        console.warn(`No servers found in Firebase collection: ${this.collectionName}`);
        return [];
      }

      snapshot.forEach((doc) => {
        servers.push(doc.data() as ServerEntity);
      });
      console.log(`Successfully mapped ${servers.length} servers.`);
      return servers;
    } catch (error: any) {
      console.error("Error fetching from Firebase, returning empty array...", error.message || error);
      return [];
    }
  }

  async createServer(server: ServerEntity): Promise<void> {
    const firestoreDb = db;
    if (!firestoreDb) return;
    await firestoreDb.collection(this.collectionName).doc(server.id.toString()).set(server);
  }

  async updateServer(id: string, serverData: Partial<ServerEntity>): Promise<void> {
    const firestoreDb = db;
    if (!firestoreDb) return;
    await firestoreDb.collection(this.collectionName).doc(id.toString()).update({
      ...serverData,
      updatedAt: Date.now()
    });
  }

  async deleteServer(id: string): Promise<void> {
    const firestoreDb = db;
    if (!firestoreDb) return;
    await firestoreDb.collection(this.collectionName).doc(id.toString()).delete();
  }

  async seedData(servers: ServerEntity[]): Promise<void> {
    const firestoreDb = db;
    if (!firestoreDb) {
      console.warn("Cannot seed dummy data because Firebase DB is not initialized.");
      return;
    }

    try {
      const batch = firestoreDb.batch();
      servers.forEach((server) => {
        const docRef = firestoreDb.collection(this.collectionName).doc(server.id.toString());
        batch.set(docRef, server);
      });
      await batch.commit();
      console.log(`Successfully seeded ${servers.length} servers into Firebase.`);
    } catch (error) {
      console.error("Error seeding data to Firebase:", error);
    }
  }
}
