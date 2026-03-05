import { IsEnum, IsString, Length } from 'class-validator';

export enum MpesaType {
  PAYBILL = 'paybill',
  TILL = 'till',
}

export class ValidateMpesaDto {
  @IsString()
  @Length(5, 10) // Paybills/Tills are usually 5-10 digits
  paybill!: string;

  @IsEnum(MpesaType)
  type!: MpesaType;
}
