import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { UssdService } from './ussd.service';

@Controller('ussd')
export class UssdController {
  constructor(private readonly ussdService: UssdService) {}

  @Post('callback')
  @HttpCode(200)
  async handleCallback(@Body() body: any, @Res() res: Response) {
    // AT sends form-encoded data: sessionId, serviceCode, phoneNumber, text
    const { sessionId, serviceCode, phoneNumber, text } = body;
    const response = await this.ussdService.handleUssd({
      sessionId,
      serviceCode,
      phoneNumber,
      text: text || '',
    });
    res.set('Content-Type', 'text/plain');
    res.send(response);
  }
}
