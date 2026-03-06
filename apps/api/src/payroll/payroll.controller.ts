import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { AddEmployeeDto, RunPayrollDto } from './dto/payroll.dto';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get(':businessId/employees')
  listEmployees(@Param('businessId') businessId: string) {
    return this.payrollService.listEmployees(businessId);
  }

  @Post(':businessId/employees')
  addEmployee(@Param('businessId') businessId: string, @Body() dto: AddEmployeeDto) {
    return this.payrollService.addEmployee(businessId, dto);
  }

  @Delete(':businessId/employees/:id')
  deactivateEmployee(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.payrollService.deactivateEmployee(businessId, id);
  }

  @Post(':businessId/run')
  runPayroll(@Param('businessId') businessId: string, @Body() dto: RunPayrollDto) {
    return this.payrollService.runPayroll(businessId, dto);
  }

  @Get(':businessId/history')
  getHistory(@Param('businessId') businessId: string) {
    return this.payrollService.getHistory(businessId);
  }
}
