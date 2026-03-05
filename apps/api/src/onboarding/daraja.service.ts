import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DarajaService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async validatePaybill(paybill: string): Promise<{ valid: boolean; businessName: string }> {
    // Use Daraja Account Balance API to verify paybill exists
    // For now, if sandbox, return mock for test paybill 174379
    const env = this.configService.get<string>('DARAJA_ENV', 'sandbox');
    if (env === 'sandbox') {
      if (paybill === '174379') {
        return { valid: true, businessName: 'Test Business' };
      }
      // In sandbox, we might want to allow other test paybills or just this one
      return { valid: true, businessName: 'Mock Sandbox Business' };
    }
    
    // Real validation logic would go here
    return { valid: true, businessName: 'Production Business' };
  }

  private async getAccessToken(): Promise<string> {
    // Stub for getting Daraja access token
    return 'mock_access_token';
  }
}
