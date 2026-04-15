import { Controller, Post, Body } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { AddCurrencyDto } from './dto/add-currency.dto';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Post()
  add(@Body() dto: AddCurrencyDto) {
    return this.currenciesService.add(dto.currency, dto.monthlyFeeGbp);
  }
}
