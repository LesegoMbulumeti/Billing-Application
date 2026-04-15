import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  @Min(0)
  transactionThreshold: number;

  @IsNumber()
  @Min(0)
  discountDays: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate: number;
}
