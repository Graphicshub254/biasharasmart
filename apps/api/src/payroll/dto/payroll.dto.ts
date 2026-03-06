import { IsString, IsNumber, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class AddEmployeeDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsNumber()
  dailyRateKes!: number;

  @IsString()
  @IsOptional()
  employmentType?: string; // 'casual' | 'permanent'

  @IsString()
  @IsOptional()
  nssfNumber?: string;

  @IsString()
  @IsOptional()
  nhifNumber?: string;
}

export class PayrollEntryDto {
  @IsUUID()
  employeeId!: string;

  @IsNumber()
  daysWorked!: number;
}

export class RunPayrollDto {
  @IsDateString()
  date!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayrollEntryDto)
  entries!: PayrollEntryDto[];
}
