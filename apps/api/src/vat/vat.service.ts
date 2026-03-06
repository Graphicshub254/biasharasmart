import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { VatReturn, VatReturnStatus } from '../entities/vat-return.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Ledger, EntryType } from '../entities/ledger.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VatService {
  constructor(
    @InjectRepository(VatReturn)
    private readonly vatReturnRepo: Repository<VatReturn>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Ledger)
    private readonly ledgerRepo: Repository<Ledger>,
  ) {}

  async listVatReturns(businessId: string, page = 1, limit = 10) {
    const [data, total] = await this.vatReturnRepo.findAndCount({
      where: { businessId },
      order: { periodYear: 'DESC', periodMonth: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getCurrentDraft(businessId: string) {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    let vatReturn = await this.vatReturnRepo.findOne({
      where: { businessId, periodMonth: month, periodYear: year },
    });

    if (!vatReturn) {
      vatReturn = this.vatReturnRepo.create({
        businessId,
        periodMonth: month,
        periodYear: year,
        status: VatReturnStatus.DRAFT,
        outputVatKes: 0,
        inputVatKes: 0,
        netVatKes: 0,
      });
      await this.vatReturnRepo.save(vatReturn);
    }

    return vatReturn;
  }

  async calculateVatForPeriod(businessId: string, month: number, year: number) {
    // Find all paid invoices in period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const invoices = await this.invoiceRepo.find({
      where: {
        businessId,
        status: InvoiceStatus.PAID,
        createdAt: Between(startDate, endDate),
      },
    });

    const outputVat = invoices.reduce((sum, inv) => sum + Number(inv.vatAmountKes), 0);
    const inputVat = 0; // T3.x will add purchase invoices
    const netVat = +(outputVat - inputVat).toFixed(2);

    // Update or create VAT return record
    let vatReturn = await this.vatReturnRepo.findOne({
      where: { businessId, periodMonth: month, periodYear: year },
    });

    if (!vatReturn) {
      vatReturn = this.vatReturnRepo.create({
        businessId,
        periodMonth: month,
        periodYear: year,
        status: VatReturnStatus.DRAFT,
      });
    }

    if (vatReturn.status !== VatReturnStatus.DRAFT) {
      throw new BadRequestException('Cannot recalculate a submitted VAT return');
    }

    vatReturn.outputVatKes = outputVat;
    vatReturn.inputVatKes = inputVat;
    vatReturn.netVatKes = netVat;

    await this.vatReturnRepo.save(vatReturn);

    return { outputVat, inputVat, netVat, invoiceCount: invoices.length, id: vatReturn.id };
  }

  async submitVatReturn(vatReturnId: string) {
    const vatReturn = await this.vatReturnRepo.findOne({ where: { id: vatReturnId } });
    if (!vatReturn) throw new NotFoundException('VAT return not found');
    if (vatReturn.status !== VatReturnStatus.DRAFT) throw new BadRequestException('Already submitted');

    // Call GavaConnect (stub in sandbox)
    const ackNumber = `VAT_ACK_${Date.now()}`;
    vatReturn.status = VatReturnStatus.SUBMITTED;
    vatReturn.gavaconnectAcknowledgement = ackNumber;
    vatReturn.submittedAt = new Date();
    await this.vatReturnRepo.save(vatReturn);

    // Write ledger: vat_computed entry
    const ledgerEntry = this.ledgerRepo.create({
      id: uuidv4(),
      businessId: vatReturn.businessId,
      entryType: EntryType.VAT_COMPUTED,
      amountKes: vatReturn.netVatKes,
      referenceId: vatReturn.id,
      checksum: `vat_${ackNumber}_${Date.now()}`,
      metadata: { period: `${vatReturn.periodMonth}/${vatReturn.periodYear}`, ackNumber },
    });
    await this.ledgerRepo.save(ledgerEntry);

    return vatReturn;
  }

  async getVatReturn(id: string) {
    const vatReturn = await this.vatReturnRepo.findOne({ where: { id } });
    if (!vatReturn) throw new NotFoundException('VAT return not found');
    return vatReturn;
  }

  async getInvoicesForPeriod(businessId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.invoiceRepo.find({
      where: {
        businessId,
        status: InvoiceStatus.PAID,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });
  }
}
