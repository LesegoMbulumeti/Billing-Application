import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from '../src/billing/billing.service';
import { AccountsService } from '../src/accounts/accounts.service';
import { CurrenciesService } from '../src/currencies/currencies.service';

describe('BillingService', () => {
  let billingService: BillingService;
  let accountsService: AccountsService;
  let currenciesService: CurrenciesService;

  // Helper to get a date N days from now
  const daysFromNow = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingService, AccountsService, CurrenciesService],
    }).compile();

    billingService = module.get<BillingService>(BillingService);
    accountsService = module.get<AccountsService>(AccountsService);
    currenciesService = module.get<CurrenciesService>(CurrenciesService);

    currenciesService.add('GBP', 10);
    currenciesService.add('USD', 8);
  });

  // ── Monthly Base Fee ────────────────────────────────────────────────────

  it('charges base fee with no transactions and no discount', () => {
    accountsService.create('acc-1', 'GBP', 100, 0, 0);
    const bill = billingService.calculate('acc-1', daysFromNow(1), daysFromNow(31), 0);

    expect(bill.baseFeeGbp).toBeGreaterThan(0);
    expect(bill.transactionFeeGbp).toBe(0);
    expect(bill.discountApplied).toBe(false);
    expect(bill.totalGbp).toBe(bill.baseFeeGbp);
  });

  it('prorates base fee for a short billing period', () => {
    accountsService.create('acc-2', 'GBP', 0, 0, 0);
    // 1-day period = £10/30 ≈ £0.33
    const bill = billingService.calculate('acc-2', daysFromNow(1), daysFromNow(2), 0);

    expect(bill.baseFeeGbp).toBe(0.33);
  });

  it('uses the correct monthly fee for the account currency', () => {
    accountsService.create('acc-3', 'USD', 0, 0, 0);
    // USD has £8/month, 30-day period
    const bill = billingService.calculate('acc-3', daysFromNow(1), daysFromNow(31), 0);

    expect(bill.baseFeeGbp).toBeLessThan(10); // USD fee (£8) < GBP fee (£10)
  });

  // ── Transaction Fees ────────────────────────────────────────────────────

  it('charges no transaction fee when count equals threshold', () => {
    accountsService.create('acc-4', 'GBP', 100, 0, 0);
    const bill = billingService.calculate('acc-4', daysFromNow(1), daysFromNow(31), 100);

    expect(bill.transactionFeeGbp).toBe(0);
  });

  it('charges transaction fee only for transactions over threshold', () => {
    accountsService.create('acc-5', 'GBP', 100, 0, 0);
    // 150 - 100 = 50 excess × £0.10 = £5.00
    const bill = billingService.calculate('acc-5', daysFromNow(1), daysFromNow(31), 150);

    expect(bill.transactionFeeGbp).toBe(5);
  });

  it('charges transaction fee for every excess transaction', () => {
    accountsService.create('acc-6', 'GBP', 0, 0, 0);
    // 10 transactions × £0.10 = £1.00
    const bill = billingService.calculate('acc-6', daysFromNow(1), daysFromNow(31), 10);

    expect(bill.transactionFeeGbp).toBe(1);
  });

  // ── Promotional Discount ────────────────────────────────────────────────

  it('applies discount when billing starts within discount window', () => {
    accountsService.create('acc-7', 'GBP', 0, 30, 20);
    const bill = billingService.calculate('acc-7', daysFromNow(1), daysFromNow(2), 0);

    expect(bill.discountApplied).toBe(true);
    expect(bill.discountRate).toBe(20);
    expect(bill.discountAmountGbp).toBeGreaterThan(0);
    expect(bill.totalGbp).toBeLessThan(bill.baseFeeGbp);
  });

  it('does not apply discount after discount window expires', () => {
    accountsService.create('acc-8', 'GBP', 0, 30, 20);
    const bill = billingService.calculate('acc-8', daysFromNow(31), daysFromNow(32), 0);

    expect(bill.discountApplied).toBe(false);
    expect(bill.discountAmountGbp).toBe(0);
  });

  it('applies discount to both base fee and transaction fees', () => {
    accountsService.create('acc-9', 'GBP', 100, 30, 50);
    // base ~£0.33 + transaction £1.00 = £1.33, 50% off = £0.67
    const bill = billingService.calculate('acc-9', daysFromNow(1), daysFromNow(2), 110);

    const subtotal = bill.baseFeeGbp + bill.transactionFeeGbp;
    expect(bill.discountAmountGbp).toBe(parseFloat((subtotal * 0.5).toFixed(2)));
    expect(bill.totalGbp).toBe(parseFloat((subtotal - bill.discountAmountGbp).toFixed(2)));
  });

  // ── Error Handling ──────────────────────────────────────────────────────

  it('throws NotFoundException for unknown account', () => {
    expect(() =>
      billingService.calculate('unknown', daysFromNow(1), daysFromNow(2), 0),
    ).toThrow('Account unknown not found');
  });

  it('throws BadRequestException for invalid date format', () => {
    accountsService.create('acc-10', 'GBP', 0, 0, 0);
    expect(() =>
      billingService.calculate('acc-10', 'not-a-date', daysFromNow(2), 0),
    ).toThrow('Invalid date format');
  });

  it('throws BadRequestException when end date is before start date', () => {
    accountsService.create('acc-11', 'GBP', 0, 0, 0);
    expect(() =>
      billingService.calculate('acc-11', daysFromNow(5), daysFromNow(2), 0),
    ).toThrow('billingPeriodEnd must be after billingPeriodStart');
  });

  it('throws BadRequestException when billing period starts before account creation', () => {
    accountsService.create('acc-12', 'GBP', 0, 0, 0);
    expect(() =>
      billingService.calculate('acc-12', '2020-01-01', '2020-01-31', 0),
    ).toThrow('billingPeriodStart cannot be before account creation date');
  });
});
