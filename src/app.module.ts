import { Module } from '@nestjs/common';
import { CurrenciesModule } from './currencies/currencies.module';
import { AccountsModule } from './accounts/accounts.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [CurrenciesModule, AccountsModule, BillingModule],
})
export class AppModule {}
