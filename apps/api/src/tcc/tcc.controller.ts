import { Controller, Get, Param } from '@nestjs/common';
import { TccService } from './tcc.service';
import { TccStatus } from '@biasharasmart/shared-types';

@Controller('tcc')
export class TccController {
  constructor(private readonly tccService: TccService) {}

  @Get(':businessId')
  getTcc(@Param('businessId') businessId: string): Promise<TccStatus> {
    return this.tccService.getTccStatus(businessId);
  }
}
