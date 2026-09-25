import { Controller, Body, Get, Post, UseGuards, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import {Roles} from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService){}
    @Get('users')
    findAllUsers() {
        return this.adminService.findAllUsers();
    }
    @Post('users')
    createUser(@Body() body: CreateUserDto){
        return this.adminService.createUser(body);
    }
    @Patch('user/:id/status')
    UpdateUserStatus(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserStatusDto){
        return this.adminService.updateUserStatus(id, body.isActive);
    }
}
