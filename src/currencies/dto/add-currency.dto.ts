import { IsString, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';

export class AddCurrencyDto {
  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  @IsPositive()
  monthlyFeeGbp: number;
}
