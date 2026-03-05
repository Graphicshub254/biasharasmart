import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class GavaConnectService {
  async validateKraPin(pin: string): Promise<{ valid: boolean; taxpayerName: string; obligations: string[] }> {
    // Stub: accepts any 11-char PIN starting with A or P
    const valid = /^[AP]\d{9}[A-Z]$/.test(pin);
    if (!valid) throw new BadRequestException('Invalid KRA PIN format');
    return {
      valid: true,
      taxpayerName: 'Test Business Kenya',
      obligations: ['VAT', 'Income Tax'],
    };
  }

  async registerEtims(businessId: string, kraPin: string): Promise<{ cuNumber: string }> {
    // Stub: returns fake CU number
    return { cuNumber: `CU${Date.now()}` };
  }

  async checkTcc(kraPin: string): Promise<{ status: 'compliant' | 'warning' | 'lapsed'; expiryDate: string }> {
    return { status: 'compliant', expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() };
  }
}
