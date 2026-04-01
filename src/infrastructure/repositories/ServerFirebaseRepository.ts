import { IServerRepository } from '../../domain/repositories/IServerRepository';
import { ServerEntity } from '../../domain/entities/ServerEntity';
import { db } from '../config/firebase';
import { dummyVpnServers } from '../data/dummyData';

export class ServerFirebaseRepository implements IServerRepository {
  private collectionName = 'vpn_servers';

  async getAllServers(): Promise<ServerEntity[]> {
    const firestoreDb = db;
    if (!firestoreDb) {
      console.warn("Returning dummy VPN data because Firebase DB is not initialized.");
      return dummyVpnServers;
    }

    try {
      const snapshot = await firestoreDb.collection(this.collectionName).get();
      const servers: ServerEntity[] = [];
      
      if (snapshot.empty) {
        console.warn("No servers found in Firebase, seeding dummy data and returning it...");
        await this.seedData(dummyVpnServers);
        return dummyVpnServers;
      }
      
      snapshot.forEach((doc) => {
        servers.push(doc.data() as ServerEntity);
      });
      return servers;
    } catch (error) {
      console.error("Error fetching from Firebase, returning dummy data...", error);
      return dummyVpnServers;
    }
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
