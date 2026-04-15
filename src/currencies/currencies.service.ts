import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';

export interface Currency {
  currency: string;
  monthlyFeeGbp: number;
}

@Injectable()
export class CurrenciesService {
  private readonly currencies = new Map<string, Currency>();

  add(currency: string, monthlyFeeGbp: number): Currency {
    if (monthlyFeeGbp < 0) {
      throw new BadRequestException('Monthly fee cannot be negative');
    }
    
    const key = currency.toUpperCase();
    if (this.currencies.has(key)) {
      throw new ConflictException(`Currency ${key} already exists`);
    }
    
    const entry: Currency = { currency: key, monthlyFeeGbp };
    this.currencies.set(key, entry);
    return entry;
  }

  findAll(): Currency[] {
    return Array.from(this.currencies.values());
  }

  find(currency: string): Currency | undefined {
    return this.currencies.get(currency.toUpperCase());
  }

  exists(currency: string): boolean {
    return this.currencies.has(currency.toUpperCase());
  }

  getAll(): Currency[] {
    return Array.from(this.currencies.values());
  }
}