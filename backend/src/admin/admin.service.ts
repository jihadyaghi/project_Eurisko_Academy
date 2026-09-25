import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService){}
    async findAllUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                departmentId: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async createUser(body: CreateUserDto) {
  if (body.role === UserRole.ADMIN) {
    throw new BadRequestException(
      'Creating additional admin accounts is not supported through this endpoint',
    );
  }

  const existingUser =
    await this.prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

  if (existingUser) {
    throw new ConflictException(
      'A user with this email already exists',
    );
  }

  let departmentId: number | null = null;

  if (body.role === UserRole.HANDLER) {
    if (!body.departmentId) {
      throw new BadRequestException(
        'A handler must belong to a department',
      );
    }

    const department =
      await this.prisma.department.findUnique({
        where: {
          id: body.departmentId,
        },
      });

    if (!department) {
      throw new NotFoundException(`Department with id ${body.departmentId} not found`,);
    }
    departmentId = department.id;
  }
  const passwordHash = await bcrypt.hash(
    body.password,
    10,
  );
  return this.prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role,
      departmentId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      isActive: true,
      createdAt: true,
    },
  });
  }
  async updateUserStatus(userId: number, isActive: boolean){
    const user = await this.prisma.user.findUnique({
        where: {
            id: userId
        }
    });
    if (!user){
        throw new NotFoundException(`User with id ${userId} not found`);
    }
    if (user.role === UserRole.ADMIN){
        throw new BadRequestException('Admin accounts cannot be deactivated through this endpoint')
    }
    return this.prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            isActive,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
            isActive: true,
            updatedAt: true
        }
    })
  }
}
