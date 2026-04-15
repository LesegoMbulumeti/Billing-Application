import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accountsService.create(
      dto.accountId,
      dto.currency,
      dto.transactionThreshold,
      dto.discountDays,
      dto.discountRate,
    );
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':accountId')
  findOne(@Param('accountId') accountId: string) {
    return this.accountsService.find(accountId);
  }
}
