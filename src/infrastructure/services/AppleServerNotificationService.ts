import { Environment, SignedDataVerifier, AppStoreServerAPIClient } from '@apple/app-store-server-library';
import fs from 'fs';
import path from 'path';
import https from 'https';

export class AppleServerNotificationService {
  private verifier: SignedDataVerifier | null = null;
  private rootCertPath = path.join(__dirname, '../../../../AppleRootCA-G3.cer');

  constructor() {
    this.initializeVerifier();
  }

  private async initializeVerifier() {
    try {
      let rootCert: Buffer;
      if (fs.existsSync(this.rootCertPath)) {
        rootCert = fs.readFileSync(this.rootCertPath);
      } else {
        rootCert = await this.downloadAppleRootCA();
        fs.writeFileSync(this.rootCertPath, rootCert);
      }

      const bundleId = process.env.APP_BUNDLE_ID || 'com.example.vpn';
      const appAppleId = process.env.APP_APPLE_ID ? parseInt(process.env.APP_APPLE_ID) : 123456789;
      // You should switch to PRODUCTION based on .env
      const environment = process.env.NODE_ENV === 'production' ? Environment.PRODUCTION : Environment.SANDBOX;

      this.verifier = new SignedDataVerifier(
        [rootCert],
        true, // enableOnlineChecks
        environment,
        bundleId,
        appAppleId
      );
    } catch (error) {
      console.error('[AppleServerNotificationService] Failed to initialize verifier:', error);
    }
  }

  private downloadAppleRootCA(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      console.log('Downloading AppleRootCA-G3.cer...');
      https.get('https://www.apple.com/certificateauthority/AppleRootCA-G3.cer', (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download certificate: ${res.statusCode}`));
          return;
        }
        const data: Buffer[] = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => resolve(Buffer.concat(data)));
      }).on('error', reject);
    });
  }

  public async verifyAndDecodeNotification(signedPayload: string): Promise<any> {
    if (!this.verifier) {
      await this.initializeVerifier();
    }
    if (!this.verifier) {
      throw new Error('SignedDataVerifier is not initialized.');
    }
    return await this.verifier.verifyAndDecodeNotification(signedPayload);
  }
}
