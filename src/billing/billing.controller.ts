import { Controller, Post, Param, Body } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CalculateBillDto } from './dto/calculate-bill.dto';

@Controller('accounts')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post(':accountId/bill')
  calculate(@Param('accountId') accountId: string, @Body() dto: CalculateBillDto) {
    return this.billingService.calculate(
      accountId,
      dto.billingPeriodStart,
      dto.billingPeriodEnd,
      dto.transactionCount,
    );
  }
}
