import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, In } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Business } from '../entities/business.entity';
import { WhtLiability, WhtLiabilityStatus } from '../entities/wht-liability.entity';
import { Ledger, EntryType } from '../entities/ledger.entity';
import { DarajaPaymentsService } from './daraja.service';
import { FraudService } from '../fraud/fraud.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ReconcilePaymentDto } from './dto/reconcile-payment.dto';
import { WHT_RATE, WHT_REMITTANCE_DAYS } from '@biasharasmart/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(WhtLiability)
    private readonly whtLiabilityRepo: Repository<WhtLiability>,
    @InjectRepository(Ledger)
    private readonly ledgerRepo: Repository<Ledger>,
    private readonly darajaService: DarajaPaymentsService,
    private readonly fraudService: FraudService,
  ) {}

  async initiateGatewayPayment(dto: InitiatePaymentDto) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: dto.invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const business = await this.businessRepo.findOne({ where: { id: invoice.businessId } });
    if (business?.vaultMode) {
      throw new ForbiddenException('Vault Mode active — payments frozen. Contact support.');
    }

    const total = Number(invoice.totalKes);

    // Check anomaly
    const isAnomaly = await this.fraudService.checkTransactionAnomaly(invoice.businessId, total);
    if (isAnomaly) {
      // Still process but flag it
      this.logger.warn(`Anomaly flagged for invoice ${dto.invoiceId}`);
    }

    const whtAmount = +(total * WHT_RATE).toFixed(2);
    const merchantAmount = +(total - whtAmount).toFixed(2);

    const { checkoutRequestId, responseCode } = await this.darajaService.initiateSTKPush(
      total,
      dto.phone,
      dto.invoiceId,
    );

    if (responseCode !== '0') {
      throw new Error('Failed to initiate STK push');
    }

    const payment = this.paymentRepo.create({
      businessId: invoice.businessId,
      invoiceId: invoice.id,
      paymentFlow: 'gateway',
      whtStatus: 'pending',
      whtAmountKes: whtAmount,
      amountKes: total,
      status: PaymentStatus.PENDING,
      phoneNumber: dto.phone,
      mpesaTransactionId: checkoutRequestId,
      idempotencyKey: `gateway_${invoice.id}_${Date.now()}`,
    });

    await this.paymentRepo.save(payment);

    return {
      checkoutRequestId,
      whtAmountKes: whtAmount,
      merchantAmountKes: merchantAmount,
      message: 'STK Push initiated successfully',
    };
  }

  async reconcileLegacyPayment(dto: ReconcilePaymentDto) {
    const existing = await this.paymentRepo.findOne({
      where: { mpesaCode: dto.mpesaCode },
    });
    if (existing) {
      throw new ConflictException('M-Pesa code already reconciled');
    }

    const invoice = await this.invoiceRepo.findOne({
      where: { id: dto.invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const whtAmount = +(dto.amountKes * WHT_RATE).toFixed(2);
    const now = new Date();

    const payment = this.paymentRepo.create({
      businessId: dto.businessId,
      invoiceId: dto.invoiceId,
      paymentFlow: 'legacy',
      whtStatus: 'pending',
      whtAmountKes: whtAmount,
      amountKes: dto.amountKes,
      mpesaCode: dto.mpesaCode,
      status: PaymentStatus.CONFIRMED,
      resolvedAt: now,
      phoneNumber: dto.phone,
      idempotencyKey: `legacy_${dto.mpesaCode}`,
    });

    await this.paymentRepo.save(payment);

    // Write Ledger
    const ledgerEntry = this.ledgerRepo.create({
      id: uuidv4(),
      businessId: dto.businessId,
      entryType: EntryType.PAYMENT_RECEIVED,
      amountKes: dto.amountKes,
      referenceId: payment.id,
      checksum: `legacy_${dto.mpesaCode}_${Date.now()}`,
      metadata: { mpesaCode: dto.mpesaCode, whtAmount, flow: 'legacy' },
    });
    await this.ledgerRepo.save(ledgerEntry);

    // Update invoice
    invoice.status = InvoiceStatus.PAID;
    await this.invoiceRepo.save(invoice);

    // Create WhtLiability
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + WHT_REMITTANCE_DAYS);

    const whtLiability = this.whtLiabilityRepo.create({
      businessId: dto.businessId,
      paymentId: payment.id,
      amountKes: whtAmount,
      dueDate,
      status: WhtLiabilityStatus.PENDING,
    });
    await this.whtLiabilityRepo.save(whtLiability);

    return { payment, whtLiability };
  }

  async handleDarajaWebhook(body: any) {
    this.logger.log('Received Daraja Webhook', JSON.stringify(body));
    const callbackData = body.Body.stkCallback;
    const checkoutRequestId = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;

    const payment = await this.paymentRepo.findOne({
      where: { mpesaTransactionId: checkoutRequestId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for checkoutRequestId: ${checkoutRequestId}`);
      return;
    }

    if (resultCode === 0) {
      const metadataItems = callbackData.CallbackMetadata.Item;
      const mpesaCode = metadataItems.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;

      payment.status = PaymentStatus.CONFIRMED;
      payment.mpesaCode = mpesaCode;
      payment.whtStatus = 'escrowed';
      payment.resolvedAt = new Date();

      // Write Ledger
      const ledgerEntry = this.ledgerRepo.create({
        id: uuidv4(),
        businessId: payment.businessId,
        entryType: EntryType.PAYMENT_RECEIVED,
        amountKes: payment.amountKes,
        referenceId: payment.id,
        checksum: `gateway_${mpesaCode}_${Date.now()}`,
        metadata: { mpesaCode, whtAmount: payment.whtAmountKes, flow: 'gateway' },
      });
      await this.ledgerRepo.save(ledgerEntry);

      // Update invoice
      if (payment.invoiceId) {
        await this.invoiceRepo.update(payment.invoiceId, { status: InvoiceStatus.PAID });
      }
    } else {
      payment.status = PaymentStatus.FAILED;
    }

    await this.paymentRepo.save(payment);
  }

  async getWhtSummary(businessId: string) {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const liabilities = await this.whtLiabilityRepo.find({
      where: {
        businessId,
        status: WhtLiabilityStatus.PENDING,
      },
      order: { dueDate: 'ASC' },
    });

    const totalPending = liabilities.reduce((sum, l) => sum + Number(l.amountKes), 0);
    const now = new Date();
    const overdueCount = liabilities.filter((l) => new Date(l.dueDate) < now).length;
    const nextDueDate = liabilities.length > 0 ? liabilities[0].dueDate : null;

    return {
      totalPending,
      overdueCount,
      nextDueDate,
      paymentMode: business.paymentMode,
    };
  }

  async listPayments(businessId: string) {
    const [data, total] = await this.paymentRepo.findAndCount({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return { data, total };
  }
}
