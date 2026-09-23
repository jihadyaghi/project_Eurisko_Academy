import {Body, Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import {ServiceRequestsService} from './service-requests.service';
import {TransitionRequestDto} from './dto/transition-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import {Roles} from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
@Controller('service-requests')
export class ServiceRequestsController {
    constructor(private readonly serviceRequestsService: ServiceRequestsService) {}
    @ Get()
    findAll() {
        return this.serviceRequestsService.findAll();
    }
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.serviceRequestsService.findOne(id);
    }
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.HANDLER)
    @Patch(':id/status')
    transitionStatus(@Param('id', ParseIntPipe) id: number, @Body() body: TransitionRequestDto, @Req() request: any) {
        return this.serviceRequestsService.transitionStatus(id, body.status, request.user.id);
    }
}
