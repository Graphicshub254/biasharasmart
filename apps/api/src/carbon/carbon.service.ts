import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { GreenAsset } from '../entities/green-asset.entity';
import { MrvReading } from '../entities/mrv-reading.entity';
import { CarbonDividend } from '../entities/carbon-dividend.entity';
import { Business } from '../entities/business.entity';
import {
  CO2_KG_PER_KWH_KENYA,
  CARBON_CREDIT_KES_PER_KG,
  MIN_KWH_FOR_DIVIDEND,
} from '@biasharasmart/shared-types';

@Injectable()
export class CarbonService {
  private readonly logger = new Logger(CarbonService.name);

  constructor(
    @InjectRepository(GreenAsset)
    private readonly greenAssetRepo: Repository<GreenAsset>,
    @InjectRepository(MrvReading)
    private readonly mrvReadingRepo: Repository<MrvReading>,
    @InjectRepository(CarbonDividend)
    private readonly carbonDividendRepo: Repository<CarbonDividend>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {}

  async getDashboardSummary(businessId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const dividend = await this.carbonDividendRepo.findOne({
      where: { businessId, periodMonth: month, periodYear: year },
    });

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      select: ['greenMultiplierActive'],
    });

    const assets = await this.greenAssetRepo.find({
      where: { businessId, active: true },
    });

    // Simple 6-month history for chart
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const div = await this.carbonDividendRepo.findOne({
        where: { businessId, periodMonth: m, periodYear: y },
      });
      history.push({
        month: d.toLocaleString('default', { month: 'short' }),
        kwh: Number(div?.totalKwh ?? 0),
        carbon: Number(div?.carbonKgAvoided ?? 0),
      });
    }

    return {
      currentMonth: {
        totalKwh: Number(dividend?.totalKwh ?? 0),
        carbonKgAvoided: Number(dividend?.carbonKgAvoided ?? 0),
        dividendKes: Number(dividend?.dividendKes ?? 0),
        kncrRef: dividend?.kncrRef ?? null,
        status: dividend?.status ?? 'pending',
      },
      greenMultiplierActive: business?.greenMultiplierActive ?? false,
      assetsCount: assets.length,
      history,
    };
  }

  async registerAsset(businessId: string, data: any) {
    const asset = this.greenAssetRepo.create({
      ...data,
      businessId,
    });
    return this.greenAssetRepo.save(asset);
  }

  async getAssets(businessId: string) {
    return this.greenAssetRepo.find({
      where: { businessId, active: true },
    });
  }

  async logReading(businessId: string, data: any) {
    const asset = await this.greenAssetRepo.findOne({
      where: { id: data.assetId, businessId },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    let carbonKgAvoided = 0;
    if (asset.assetType === 'SOLAR') {
      carbonKgAvoided = Number(data.kwhGenerated ?? 0) * CO2_KG_PER_KWH_KENYA;
    } else if (asset.assetType === 'EV') {
      carbonKgAvoided = Number(data.evKmCharged ?? 0) * 0.21;
    } else if (asset.assetType === 'CLEAN_COOKING') {
      carbonKgAvoided = Number(data.cleanCookingMeals ?? 0) * 0.8;
    }

    const reading = this.mrvReadingRepo.create({
      ...data,
      businessId,
      carbonKgAvoided: +carbonKgAvoided.toFixed(3),
    });
    return this.mrvReadingRepo.save(reading);
  }

  async getDividends(businessId: string) {
    return this.carbonDividendRepo.find({
      where: { businessId },
      order: { periodYear: 'DESC', periodMonth: 'DESC' },
    });
  }

  async calculateMonthlyDividend(businessId: string, month: number, year: number) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

    const readings = await this.mrvReadingRepo.find({
      where: { businessId, readingDate: Between(startDate, endDate) },
    });

    const totalKwh = readings.reduce((s, r) => s + Number(r.kwhGenerated ?? 0), 0);
    const totalEvKm = readings.reduce((s, r) => s + Number(r.evKmCharged ?? 0), 0);
    const totalMeals = readings.reduce((s, r) => s + (r.cleanCookingMeals ?? 0), 0);

    const carbonFromSolar = +(totalKwh * CO2_KG_PER_KWH_KENYA).toFixed(3);
    const carbonFromEv = +(totalEvKm * 0.21).toFixed(3);
    const carbonFromCooking = +(totalMeals * 0.8).toFixed(3);
    const totalCarbon = +(carbonFromSolar + carbonFromEv + carbonFromCooking).toFixed(3);

    const dividendKes = totalKwh >= MIN_KWH_FOR_DIVIDEND
      ? +(totalCarbon * CARBON_CREDIT_KES_PER_KG).toFixed(2)
      : 0;

    const existing = await this.carbonDividendRepo.findOne({
      where: { businessId, periodMonth: month, periodYear: year },
    });

    const dividend = await this.carbonDividendRepo.save({
      ...(existing ?? {}),
      businessId,
      periodMonth: month,
      periodYear: year,
      totalKwh: +totalKwh.toFixed(3),
      carbonKgAvoided: totalCarbon,
      dividendKes,
      kncrRef: `KNCR_STUB_${businessId.slice(-6)}_${year}${month}`,
      status: 'verified',
    });

    if (totalKwh >= MIN_KWH_FOR_DIVIDEND) {
      await this.businessRepo.update(businessId, { greenMultiplierActive: true });
    }

    return { totalKwh, totalCarbon, dividendKes, readings: readings.length };
  }
}
