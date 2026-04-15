import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CurrenciesService } from '../currencies/currencies.service';

export interface Account {
  accountId: string;
  currency: string;
  transactionThreshold: number;
  discountDays: number;
  discountRate: number;
  createdAt: Date;
}

@Injectable()
export class AccountsService {
  private readonly accounts = new Map<string, Account>();

  constructor(private readonly currenciesService: CurrenciesService) {}

  create(
    accountId: string,
    currency: string,
    transactionThreshold: number,
    discountDays: number,
    discountRate: number,
  ): Account {
    if (this.accounts.has(accountId)) {
      throw new ConflictException(`Account ${accountId} already exists`);
    }
    const cur = this.currenciesService.find(currency);
    if (!cur) {
      throw new NotFoundException(`Currency ${currency} not found`);
    }
    const account: Account = {
      accountId,
      currency: cur.currency,
      transactionThreshold,
      discountDays,
      discountRate,
      createdAt: new Date(),
    };
    this.accounts.set(accountId, account);
    return account;
  }

  findAll(): Account[] {
    return Array.from(this.accounts.values());
  }

  find(accountId: string): Account {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }
    return account;
  }
}
