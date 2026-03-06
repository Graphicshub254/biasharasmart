import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DarajaPaymentsService {
  private readonly logger = new Logger(DarajaPaymentsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async getAccessToken(): Promise<string> {
    const env = this.configService.get<string>('DARAJA_ENV', 'sandbox');
    if (env === 'sandbox') {
      return 'sandbox-token';
    }

    const consumerKey = this.configService.get<string>('DARAJA_CONSUMER_KEY');
    const consumerSecret = this.configService.get<string>('DARAJA_CONSUMER_SECRET');
    const baseUrl = this.configService.get<string>('DARAJA_BASE_URL');

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
          headers: { Authorization: `Basic ${auth}` },
        }),
      );
      return response.data.access_token;
    } catch (error) {
      this.logger.error('Failed to get Daraja access token', error);
      throw error;
    }
  }

  async initiateSTKPush(amount: number, phone: string, invoiceId: string): Promise<{ checkoutRequestId: string; responseCode: string }> {
    const env = this.configService.get<string>('DARAJA_ENV', 'sandbox');
    if (env === 'sandbox') {
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const random = Math.floor(1000 + Math.random() * 9000);
      return {
        checkoutRequestId: `ws_CO_${timestamp}_${random}`,
        responseCode: '0',
      };
    }

    const token = await this.getAccessToken();
    const shortCode = this.configService.get<string>('DARAJA_SHORTCODE');
    const passkey = this.configService.get<string>('DARAJA_PASSKEY');
    const baseUrl = this.configService.get<string>('DARAJA_BASE_URL');
    const callbackUrl = this.configService.get<string>('DARAJA_CALLBACK_URL');

    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: invoiceId,
      TransactionDesc: `Invoice payment ${invoiceId}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return {
        checkoutRequestId: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
      };
    } catch (error) {
      this.logger.error('Daraja STK push failed', error);
      throw error;
    }
  }
}
