import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { AccountsModule } from '../accounts/accounts.module';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [AccountsModule, CurrenciesModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
