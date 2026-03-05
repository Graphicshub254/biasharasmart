import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { GavaConnectService } from './gavaconnect.service';
import { DarajaService } from './daraja.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly gavaConnectService: GavaConnectService,
    private readonly darajaService: DarajaService,
  ) {}

  async validatePin(kraPin: string) {
    return this.gavaConnectService.validateKraPin(kraPin);
  }

  async validateMpesa(paybill: string, type: 'paybill' | 'till') {
    return this.darajaService.validatePaybill(paybill);
  }

  async completeOnboarding(dto: CompleteOnboardingDto): Promise<{
    success: boolean;
    businessId: string;
    cuNumber: string;
  }> {
    const existing = await this.businessRepository.findOne({
      where: { kraPin: dto.kraPin },
    });

    if (existing) {
      throw new ConflictException('Business with this KRA PIN already exists');
    }

    let businessName = dto.businessName;
    if (!businessName) {
      const pinInfo = await this.gavaConnectService.validateKraPin(dto.kraPin);
      businessName = pinInfo.taxpayerName;
    }

    const business = this.businessRepository.create({
      kraPin: dto.kraPin,
      businessName: businessName,
      businessType: dto.businessType,
      mpesaPaybill: dto.paybillType === 'paybill' ? dto.paybill : undefined,
      mpesaTill: dto.paybillType === 'till' ? dto.paybill : undefined,
    });

    const saved = await this.businessRepository.save(business);

    // 2. Call GavaConnectService.registerEtims()
    const { cuNumber } = await this.gavaConnectService.registerEtims(saved.id, saved.kraPin);

    // 3. Store the returned cuNumber
    saved.cuNumber = cuNumber;
    await this.businessRepository.save(saved);

    return {
      success: true,
      businessId: saved.id,
      cuNumber,
    };
  }

  async uploadKyc(file: Express.Multer.File) {
    const bucket = process.env.AWS_S3_BUCKET || 'biasharasmart-kyc';
    const key = `kyc/${Date.now()}-${file.originalname}`;
    return {
      url: `https://${bucket}.s3.amazonaws.com/${key}`,
      key,
    };
  }
}
