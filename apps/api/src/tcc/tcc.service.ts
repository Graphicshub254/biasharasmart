import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { GavaConnectService } from '../onboarding/gavaconnect.service';
import { TccStatus } from '@biasharasmart/shared-types';

@Injectable()
export class TccService {
  // In-memory cache: avoid hammering GavaConnect on every request
  // Cache result for 1 hour per business
  private cache = new Map<string, { data: TccStatus; cachedAt: Date }>();

  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly gavaConnectService: GavaConnectService,
  ) {}

  async getTccStatus(businessId: string): Promise<TccStatus> {
    const cached = this.cache.get(businessId);
    if (cached) {
      const ageMinutes = (Date.now() - cached.cachedAt.getTime()) / 60000;
      if (ageMinutes < 60) return cached.data;
    }

    const business = await this.businessRepository.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const result = await this.gavaConnectService.checkTcc(business.kraPin);

    // Calculate daysRemaining from expiryDate
    const expiry = new Date(result.expiryDate);
    const now = new Date();
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const tccStatus: TccStatus = {
      status: result.status,
      expiryDate: result.expiryDate,
      daysRemaining: Math.max(0, daysRemaining),
    };

    this.cache.set(businessId, { data: tccStatus, cachedAt: new Date() });
    return tccStatus;
  }
}
