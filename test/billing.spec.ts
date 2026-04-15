import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from '../src/billing/billing.service';
import { AccountsService } from '../src/accounts/accounts.service';
import { CurrenciesService } from '../src/currencies/currencies.service';

describe('BillingService', () => {
  let billingService: BillingService;
  let accountsService: AccountsService;
  let currenciesService: CurrenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingService, AccountsService, CurrenciesService],
    }).compile();

    billingService = module.get<BillingService>(BillingService);
    accountsService = module.get<AccountsService>(AccountsService);
    currenciesService = module.get<CurrenciesService>(CurrenciesService);

    currenciesService.add('GBP', 10);
  });

  it('charges base fee only when transactions are under threshold', () => {
    accountsService.create('acc-1', 'GBP', 100, 0, 0);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bill = billingService.calculate(
      'acc-1',
      today.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0],
      50,
    );

    expect(bill.baseFeeGbp).toBeGreaterThan(0);
    expect(bill.transactionFeeGbp).toBe(0);
    expect(bill.discountApplied).toBe(false);
    expect(bill.totalGbp).toBe(bill.baseFeeGbp);
  });

  it('charges transaction fee for transactions over threshold', () => {
    accountsService.create('acc-2', 'GBP', 100, 0, 0);
    const bill = billingService.calculate('acc-2', '2026-04-01', '2026-04-30', 150);

    // 50 excess transactions × £0.10 = £5.00
    expect(bill.transactionFeeGbp).toBe(5);
  });

  it('applies promotional discount within discount window', () => {
    accountsService.create('acc-3', 'GBP', 100, 30, 20);
    // Bill start is today — within 30-day discount window
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bill = billingService.calculate(
      'acc-3',
      today.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0],
      0,
    );

    expect(bill.discountApplied).toBe(true);
    expect(bill.discountRate).toBe(20);
    expect(bill.discountAmountGbp).toBeGreaterThan(0);
    expect(bill.totalGbp).toBeLessThan(bill.baseFeeGbp);
  });

  it('does not apply discount after discount window expires', () => {
    accountsService.create('acc-4', 'GBP', 100, 30, 20);
    // Bill start is 31 days after account creation (past discount window)
    const future = new Date();
    future.setDate(future.getDate() + 31);
    const dayAfter = new Date(future);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const bill = billingService.calculate(
      'acc-4',
      future.toISOString().split('T')[0],
      dayAfter.toISOString().split('T')[0],
      0,
    );

    expect(bill.discountApplied).toBe(false);
    expect(bill.discountAmountGbp).toBe(0);
  });

  it('throws NotFoundException for unknown account', () => {
    expect(() =>
      billingService.calculate('unknown', '2026-04-01', '2026-04-30', 0),
    ).toThrow('Account unknown not found');
  });

  it('throws BadRequestException for invalid dates', () => {
    accountsService.create('acc-5', 'GBP', 100, 0, 0);
    expect(() =>
      billingService.calculate('acc-5', 'not-a-date', '2026-04-30', 0),
    ).toThrow('Invalid date format');
  });

  it('throws BadRequestException when end date is before start date', () => {
    accountsService.create('acc-6', 'GBP', 100, 0, 0);
    expect(() =>
      billingService.calculate('acc-6', '2026-04-30', '2026-04-01', 0),
    ).toThrow('billingPeriodEnd must be after billingPeriodStart');
  });
});
