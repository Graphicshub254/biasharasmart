import { Controller, Post, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OnboardingService } from './onboarding.service';
import { ValidatePinDto } from './dto/validate-pin.dto';
import { ValidateMpesaDto } from './dto/validate-mpesa.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Controller('onboard')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('validate-pin')
  async validatePin(@Body() dto: ValidatePinDto) {
    return this.onboardingService.validatePin(dto.kraPin);
  }

  @Post('validate-mpesa')
  async validateMpesa(@Body() dto: ValidateMpesaDto) {
    return this.onboardingService.validateMpesa(dto.paybill, dto.type);
  }

  @Post('submit-kyc')
  @UseInterceptors(FileInterceptor('file'))
  async submitKyc(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('KYC file is required');
    }
    return this.onboardingService.uploadKyc(file);
  }

  @Post('complete')
  async complete(@Body() dto: CompleteOnboardingDto) {
    return this.onboardingService.completeOnboarding(dto);
  }
}
