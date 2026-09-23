import { Injectable, UnauthorizedException } from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly JwtService: JwtService){}
    async login(loginDto: LoginDto){
        const user = await this.prisma.user.findUnique({
            where: {
                email: loginDto.email,
            },
            include: {
                department: true,
            }
        });
        if (!user){
            throw new UnauthorizedException('Invalid credentials')
        }
        const passwordMtaches = await bcrypt.compare(
            loginDto.password,
            user.passwordHash
        );
        if (!passwordMtaches){
            throw new UnauthorizedException('Invalid credentials')
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId
        };
        const accessToken = await this.JwtService.signAsync(payload);
        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                departmentId: user.departmentId,
                department: user.department?.name ?? null
            }
        }
    }
}
