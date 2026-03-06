import { Controller, Get, Param } from '@nestjs/common';
import { ScoreService } from './score.service';

@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Get(':businessId')
  async getScore(@Param('businessId') businessId: string) {
    return this.scoreService.calculateScore(businessId);
  }
}
