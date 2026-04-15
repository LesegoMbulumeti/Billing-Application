import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import { CurrenciesService } from '../currencies/currencies.service';

export interface BillBreakdown {
  accountId: string;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  baseFeeGbp: number;
  transactionFeeGbp: number;
  discountApplied: boolean;
  discountRate: number;
  discountAmountGbp: number;
  totalGbp: number;
}

@Injectable()
export class BillingService {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly currenciesService: CurrenciesService,
  ) {}

  calculate(
    accountId: string,
    billingPeriodStart: string,
    billingPeriodEnd: string,
    transactionCount: number,
  ): BillBreakdown {
    const start = new Date(billingPeriodStart);
    const end = new Date(billingPeriodEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601.');
    }
    if (end <= start) {
      throw new BadRequestException('billingPeriodEnd must be after billingPeriodStart');
    }

    const account = this.accountsService.find(accountId);

    if (start < account.createdAt) {
      throw new BadRequestException('billingPeriodStart cannot be before account creation date');
    }

    if (transactionCount < 0) {
      throw new BadRequestException('transactionCount cannot be negative');
    }

    const currency = this.currenciesService.find(account.currency)!;

    // Base fee — prorated by days in billing period vs 30-day month
    const billingDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const baseFeeGbp = parseFloat(((currency.monthlyFeeGbp / 30) * billingDays).toFixed(2));

    // Transaction fee — £0.10 per transaction over threshold
    const excessTransactions = Math.max(0, transactionCount - account.transactionThreshold);
    const transactionFeeGbp = parseFloat((excessTransactions * 0.10).toFixed(2));

    // Discount — applied if billing period start is within discountDays of account creation
    const daysSinceCreation = Math.max(0, Math.floor(
      (start.getTime() - account.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    ));
    const discountApplied = daysSinceCreation < account.discountDays;
    const subtotal = baseFeeGbp + transactionFeeGbp;
    const discountAmountGbp = discountApplied
      ? parseFloat(((subtotal * account.discountRate) / 100).toFixed(2))
      : 0;

    const totalGbp = parseFloat((subtotal - discountAmountGbp).toFixed(2));

    return {
      accountId,
      currency: account.currency,
      billingPeriodStart,
      billingPeriodEnd,
      baseFeeGbp,
      transactionFeeGbp,
      discountApplied,
      discountRate: discountApplied ? account.discountRate : 0,
      discountAmountGbp,
      totalGbp,
    };
  }
}
