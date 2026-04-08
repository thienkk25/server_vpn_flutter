export interface AppleReceiptResponse {
  status: number;
  environment: string;
  receipt?: {
    bundle_id: string;
    in_app: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date_ms: string;
      expires_date_ms?: string;
      cancellation_date_ms?: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    purchase_date_ms: string;
    expires_date_ms?: string;
    cancellation_date_ms?: string;
  }>;
  pending_renewal_info?: Array<{
    auto_renew_status: string;
    product_id: string;
    expiration_intent?: string;
    is_in_billing_retry_period?: string;
  }>;
}

export class AppleIapService {
  private readonly productionUrl = 'https://buy.itunes.apple.com/verifyReceipt';
  private readonly sandboxUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';

  // Shared secret for auto-renewable subscriptions
  private readonly sharedSecret = process.env.APPLE_SHARED_SECRET || '';

  async verifyReceipt(receiptData: string): Promise<AppleReceiptResponse> {
    const payload = {
      'receipt-data': receiptData,
      password: this.sharedSecret,
    };

    // First try production
    let result = await this.callAppleApi(this.productionUrl, payload);

    // 21007 means this is a sandbox receipt, so retry with sandbox URL
    if (result.status === 21007) {
      result = await this.callAppleApi(this.sandboxUrl, payload);
    }

    return result;
  }

  private async callAppleApi(url: string, payload: any): Promise<AppleReceiptResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal as RequestInit['signal'],
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to verify receipt with Apple: ${response.statusText}`);
      }

      return (await response.json()) as AppleReceiptResponse;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Apple verification timeout on ${url}`);
      }
      throw error;
    }
  }
}
