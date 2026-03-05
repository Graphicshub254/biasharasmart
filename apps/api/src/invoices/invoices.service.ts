import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Business } from '../entities/business.entity';
import { GavaConnectService } from '../onboarding/gavaconnect.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly gavaConnectService: GavaConnectService,
  ) {}

  async listInvoices(query: InvoiceQueryDto): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    const { businessId, status, page = 1, limit = 20 } = query;
    const where: any = { businessId };
    if (status) where.status = status;

    const [data, total] = await this.invoiceRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    // 1. Calculate totals from line items
    let subtotal = 0;
    let vatTotal = 0;
    const lineItems = dto.lineItems.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const lineVat = lineTotal * item.vatRate;
      subtotal += lineTotal;
      vatTotal += lineVat;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        total: lineTotal,
      };
    });
    const total = subtotal + vatTotal;

    // 2. Create invoice record
    const invoice = this.invoiceRepository.create({
      businessId: dto.businessId,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      lineItems,
      subtotalKes: subtotal,
      vatAmountKes: vatTotal,
      totalKes: total,
      status: InvoiceStatus.DRAFT,
      offlineQueued: false,
    });

    const saved = await this.invoiceRepository.save(invoice);

    // 3. Try GavaConnect — if it fails, mark offlineQueued
    try {
      const business = await this.businessRepository.findOne({
        where: { id: dto.businessId },
      });
      if (!business) throw new Error('Business not found');

      const { cuNumber } = await this.gavaConnectService.registerEtims(
        saved.id,
        business.kraPin,
      );
      saved.cuNumber = cuNumber;
      saved.status = InvoiceStatus.PENDING_KRA;
      saved.offlineQueued = false;
      return this.invoiceRepository.save(saved);
    } catch (e) {
      // GavaConnect failed — mark for retry
      saved.offlineQueued = true;
      return this.invoiceRepository.save(saved);
    }
  }

  async getInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto): Promise<Invoice> {
    const invoice = await this.getInvoice(id);
    invoice.status = dto.status;
    return this.invoiceRepository.save(invoice);
  }

  async syncInvoice(id: string): Promise<Invoice> {
    const invoice = await this.getInvoice(id);
    if (!invoice.offlineQueued) return invoice; // nothing to do

    const business = await this.businessRepository.findOne({
      where: { id: invoice.businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const { cuNumber } = await this.gavaConnectService.registerEtims(
      invoice.id,
      business.kraPin,
    );
    invoice.cuNumber = cuNumber;
    invoice.status = InvoiceStatus.PENDING_KRA;
    invoice.offlineQueued = false;
    return this.invoiceRepository.save(invoice);
  }
}
