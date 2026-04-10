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
        maintenanceMode: false, 
        privacyPolicyUrl: 'https://example.com/privacy', 
        termsOfServiceUrl: 'https://example.com/tos',
        systemMessage: '',
        flashSaleEndDate: null
      };
      await this.docRef.set(defaultSettings);
      return defaultSettings;
    }
    return doc.data();
  }

  async updateSettings(updates: any): Promise<any> {
    if (!admin.apps.length) throw new Error("Firebase not initialized");
    await this.docRef.set(updates, { merge: true });
    return await this.getSettings();
  }
}
