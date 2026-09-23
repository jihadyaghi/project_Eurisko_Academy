import {Body,Controller,Get,Param,ParseIntPipe,Patch,Post,Req,UseGuards,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ServiceRequestsService } from './service-requests.service';
import { TransitionRequestDto } from './dto/transition-request.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService,) {}
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @Post()
  create(@Body() body: CreateServiceRequestDto,@Req() request: any,) {
    return this.serviceRequestsService.create(
      request.user.id,
      body,
    );
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @Get('my')
  getMyRequests(@Req() request: any) {
  return this.serviceRequestsService.findByEmployee(
    request.user.id,
  );
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.HANDLER)
  @Get('handler/inbox')
  getHandlerInbox(@Req() request: any) {
    return this.serviceRequestsService.findByDepartment(
      request.user.departmentId,
    );
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.HANDLER)
  @Patch(':id/assign')
  assignToMe(@Param('id', ParseIntPipe) id: number,@Req() request: any,) {
  return this.serviceRequestsService.assignToHandler(
    id,
    request.user.id,
    request.user.departmentId,
  );
  }
  @Get()
  findAll() {
    return this.serviceRequestsService.findAll();
  }
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number,) {
    return this.serviceRequestsService.findOne(id);
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.HANDLER)
  @Patch(':id/status')
  transitionStatus(@Param('id', ParseIntPipe) id: number,@Body() body: TransitionRequestDto,@Req() request: any,) {
    return this.serviceRequestsService.transitionStatus(
      id,
      body.status,
      request.user.id,
    );
  }
}