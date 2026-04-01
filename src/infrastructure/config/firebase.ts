import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env only in local development (Render automatically injects env vars)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

let isInitialized = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // Render: Base64 encoded JSON string to avoid quote escaping issues
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decoded);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    isInitialized = true;
    console.log("Firebase initialized successfully using Base64 environment variable.");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Render: Raw JSON string in environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    isInitialized = true;
    console.log("Firebase initialized successfully using JSON environment variable.");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    // Render: Secret File path
    const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    isInitialized = true;
    console.log("Firebase initialized successfully using service account file.");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // GCP / Default Application Credentials
    admin.initializeApp();
    isInitialized = true;
    console.log("Firebase initialized successfully using Google Application Credentials.");
  } else {
    console.warn("No Firebase credentials provided. Running in Dummy Data mode only.");
  }
} catch (error) {
  console.error("Firebase Admin SDK initialization failed:", error);
}

export const db = isInitialized ? admin.firestore() : null;
