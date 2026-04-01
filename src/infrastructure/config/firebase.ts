import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase initialized successfully using service account file.");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase initialized successfully using JSON environment variable.");
  } else {
    // Attempt default initialization
    admin.initializeApp();
    console.log("Firebase initialized successfully using default application credentials.");
  }
} catch (error) {
  console.warn("Firebase Admin SDK initialization failed or incomplete. Using Fallback.");
}

export const db = admin.apps.length > 0 ? admin.firestore() : null;
