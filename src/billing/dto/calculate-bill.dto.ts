import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CalculateBillDto {
  @IsString()
  @IsNotEmpty()
  billingPeriodStart: string;

  @IsString()
  @IsNotEmpty()
  billingPeriodEnd: string;

  @IsNumber()
  @Min(0)
  transactionCount: number;
}
