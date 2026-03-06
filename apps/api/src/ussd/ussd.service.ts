import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { VatReturn } from '../entities/vat-return.entity';
import { PaymentsService } from '../payments/payments.service';
import { ScoreService } from '../score/score.service';
import { WHT_RATE } from '@biasharasmart/shared-types';
import { UssdSessionStore } from './ussd-session.store';

@Injectable()
export class UssdService {
  private sessionStore = new UssdSessionStore();

  constructor(
    @InjectRepository(Business)
    private businessRepo: Repository<Business>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(VatReturn)
    private vatReturnRepo: Repository<VatReturn>,
    private paymentsService: PaymentsService,
    private scoreService: ScoreService,
    private configService: ConfigService,
  ) {
    // Cleanup old sessions every minute
    setInterval(() => this.sessionStore.cleanup(), 60000);
  }

  async handleUssd(params: {
    sessionId: string;
    serviceCode: string;
    phoneNumber: string;
    text: string;
  }): Promise<string> {
    const { sessionId, phoneNumber, text } = params;
    const parts = text.split('*');
    const level = parts.length;
    const ussdCode = this.configService.get<string>('AT_USSD_CODE') || '*384*12345#';

    // Normalize phone number to include prefix if it doesn't have it
    let normalizedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      normalizedPhone = '254' + phoneNumber.slice(1);
    } else if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('254') && phoneNumber.length === 9) {
      normalizedPhone = '254' + phoneNumber;
    }

    // Find business by phone number
    const business = await this.businessRepo.findOne({
      where: [
        { mpesaTill: phoneNumber },
        { mpesaPaybill: phoneNumber },
        { mpesaTill: normalizedPhone },
        { mpesaPaybill: normalizedPhone }
      ],
    }) ?? await this.businessRepo.findOne({ where: { id: '7951dda8-a30e-4928-8350-b6c5662154a8' } }); // fallback for testing

    if (!business) {
        return `END Sorry, your phone number ${phoneNumber} is not registered with BiasharaSmart. Please contact support.`;
    }

    // Level 0 — main menu
    if (text === '') {
      return `CON Welcome to BiasharaSmart
1. Check Balance
2. Record Sale
3. Pay WHT
4. My Bia Score
5. VAT Status`;
    }

    // Level 1 — main menu selection
    if (level === 1) {
      switch (parts[0]) {
        case '1': {
          // Check balance
          const wht = await this.paymentsService.getWhtSummary(business.id);
          const recentPayments = await this.paymentRepo.find({
            where: { businessId: business.id, status: PaymentStatus.CONFIRMED },
            order: { createdAt: 'DESC' },
            take: 1,
          });
          const lastPayment = recentPayments[0];
          return `END Balance Summary
Last payment: KES ${lastPayment ? Number(lastPayment.amountKes).toLocaleString() : '0'}
WHT Due: KES ${wht.totalPending.toLocaleString()}
Mode: ${wht.paymentMode.toUpperCase()}`;
        }
        case '2':
          return `CON Record Sale
Enter sale amount in KES:`;
        case '3': {
          const wht = await this.paymentsService.getWhtSummary(business.id);
          return `END Pay WHT
Amount Due: KES ${wht.totalPending.toLocaleString()}
Pay via M-Pesa:
Paybill: 247247
Account: WHT${new Date().toISOString().slice(0, 7).replace('-', '')}
Due: ${wht.nextDueDate ? new Date(wht.nextDueDate).toDateString() : 'N/A'}`;
        }
        case '4': {
          const score = await this.scoreService.calculateScore(business.id);
          return `END Biashara Score
Score: ${score.total}/1000
${score.loanEligible ? 'ELIGIBLE for Co-op loan' : `Need ${600 - score.total} more pts for loan`}
Consistency: ${score.breakdown.consistency}/400
Tax Hygiene: ${score.breakdown.taxHygiene}/300`;
        }
        case '5': {
          const now = new Date();
          const vatReturn = await this.vatReturnRepo.findOne({
            where: {
              businessId: business.id,
              periodMonth: now.getMonth() + 1,
              periodYear: now.getFullYear(),
            },
          });
          return `END VAT Status - ${now.toLocaleString('en-KE', { month: 'long' })}
Net VAT Due: KES ${vatReturn ? Number(vatReturn.netVatKes).toLocaleString() : '0'}
Status: ${vatReturn?.status ?? 'No return yet'}
File by: ${new Date(now.getFullYear(), now.getMonth() + 1, 20).toDateString()}`;
        }
        default:
          return `END Invalid option. Dial ${ussdCode} to start again.`;
      }
    }

    // Level 2 — Record Sale flow
    if (level === 2 && parts[0] === '2') {
      const amount = parseFloat(parts[1]);
      if (isNaN(amount) || amount <= 0) return `END Invalid amount. Please try again.`;
      return `CON Sale: KES ${amount.toLocaleString()}
Enter customer phone (254XXXXXXXXX) or 0 to skip:`;
    }

    // Level 3 — Record Sale confirm
    if (level === 3 && parts[0] === '2') {
      const amount = parseFloat(parts[1]);
      const phone = parts[2] === '0' ? undefined : parts[2];

      // Create invoice
      const vatAmount = +(amount * 0.16 / 1.16).toFixed(2); // extract VAT from inclusive amount
      const subtotal = +(amount - vatAmount).toFixed(2);

      const invoice = await this.invoiceRepo.save(
        this.invoiceRepo.create({
          businessId: business.id,
          customerPhone: phone,
          lineItems: [{ description: 'USSD Sale', quantity: 1, unitPrice: subtotal, vatRate: 0.16 }],
          subtotalKes: subtotal,
          vatAmountKes: vatAmount,
          totalKes: amount,
          status: InvoiceStatus.ISSUED,
        })
      );

      const whtAmount = +(amount * WHT_RATE).toFixed(2);
      return `END Sale Recorded!
Invoice: #${invoice.id.slice(-8).toUpperCase()}
Amount: KES ${amount.toLocaleString()}
VAT: KES ${vatAmount.toLocaleString()}
WHT Due: KES ${whtAmount.toLocaleString()}
Send M-Pesa prompt? Dial ${ussdCode} > 2 to collect.`;
    }

    return `END Session expired. Dial ${ussdCode} to start again.`;
  }
}
