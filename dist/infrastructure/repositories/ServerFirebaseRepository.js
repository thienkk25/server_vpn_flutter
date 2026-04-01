"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerFirebaseRepository = void 0;
const firebase_1 = require("../config/firebase");
const dummyData_1 = require("../data/dummyData");
class ServerFirebaseRepository {
    collectionName = 'vpn_servers';
    async getAllServers() {
        const firestoreDb = firebase_1.db;
        if (!firestoreDb) {
            console.warn("Returning dummy VPN data because Firebase DB is not initialized.");
            return dummyData_1.dummyVpnServers;
        }
        try {
            const snapshot = await firestoreDb.collection(this.collectionName).get();
            const servers = [];
            if (snapshot.empty) {
                console.warn("No servers found in Firebase, seeding dummy data and returning it...");
                await this.seedData(dummyData_1.dummyVpnServers);
                return dummyData_1.dummyVpnServers;
            }
            snapshot.forEach((doc) => {
                servers.push(doc.data());
            });
            return servers;
        }
        catch (error) {
            console.error("Error fetching from Firebase, returning dummy data...", error);
            return dummyData_1.dummyVpnServers;
        }
    }
    async seedData(servers) {
        const firestoreDb = firebase_1.db;
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
        }
        catch (error) {
            console.error("Error seeding data to Firebase:", error);
        }
    }
}
exports.ServerFirebaseRepository = ServerFirebaseRepository;
