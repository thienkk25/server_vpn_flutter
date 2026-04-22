import * as admin from 'firebase-admin';

export class AdminSettingsUseCases {
  private get docRef() {
    return admin.firestore().collection('app_settings').doc('general');
  }

  async getSettings(): Promise<any> {
    if (!admin.apps.length) return {};
    
    const doc = await this.docRef.get();
    if (!doc.exists) {
      // Default settings
      const defaultSettings = { 
        privacyPolicyUrl: 'https://example.com/privacy', 
        termsOfServiceUrl: 'https://example.com/tos',
        privacyPolicyContent: '<h1>Privacy Policy</h1><p>Set your privacy policy content here.</p>',
        termsOfServiceContent: '<h1>Terms of Service</h1><p>Set your terms of service content here.</p>',
      };
      await this.docRef.set(defaultSettings);
      return defaultSettings;
    }
    
    let data = doc.data() || {};
    return data;
  }

  async updateSettings(updates: any): Promise<any> {
    if (!admin.apps.length) throw new Error("Firebase not initialized");
    await this.docRef.set(updates, { merge: true });
    return await this.getSettings();
  }
}
