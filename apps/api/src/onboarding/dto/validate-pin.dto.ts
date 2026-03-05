import { IsString, Length, Matches } from 'class-validator';

export class ValidatePinDto {
  @IsString()
  @Length(11, 11)
  @Matches(/^[AP]\d{9}[A-Z]$/, { message: 'Invalid KRA PIN format' })
  kraPin!: string;
}
