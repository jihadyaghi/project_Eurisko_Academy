import {BadRequestException, ForbiddenException, Injectable, NotFoundException,} from '@nestjs/common';
import { ServiceRequestStatus } from './enum/service-request-status.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    employeeId: number,
    body: CreateServiceRequestDto,
  ) {
    const department =
      await this.prisma.department.findUnique({
        where: {
          id: body.departmentId,
        },
      });

    if (!department) {
      throw new NotFoundException(
        `Department with id ${body.departmentId} not found`,
      );
    }

    return this.prisma.serviceRequest.create({
      data: {
        employeeId,
        departmentId: body.departmentId,
        handlerId: null,
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority,
        status: ServiceRequestStatus.SUBMITTED,
      },
    });
  }

  async findOne(id: number) {
    const serviceRequest =
      await this.prisma.serviceRequest.findUnique({
        where: {
          id,
        },
      });

    if (!serviceRequest) {
      throw new NotFoundException(
        `Service request with id ${id} not found`,
      );
    }

    return serviceRequest;
  }

  async transitionStatus(
    id: number,
    targetStatus: ServiceRequestStatus,
    handlerId: number,
  ) {
    const serviceRequest =
      await this.prisma.serviceRequest.findUnique({
        where: {
          id,
        },

        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    if (!serviceRequest) {
      throw new NotFoundException(
        `Service request with id ${id} not found`,
      );
    }

    if (
      serviceRequest.handlerId !== handlerId
    ) {
      throw new ForbiddenException(
        'Only the assigned handler can change this Service Request status',
      );
    }

    const validTransitions: Record<
      ServiceRequestStatus,
      ServiceRequestStatus[]
    > = {
      [ServiceRequestStatus.SUBMITTED]: [
        ServiceRequestStatus.IN_PROGRESS,
      ],

      [ServiceRequestStatus.IN_PROGRESS]: [
        ServiceRequestStatus.COMPLETED,
      ],

      [ServiceRequestStatus.COMPLETED]: [],
    };

    const currentStatus =
      serviceRequest.status as ServiceRequestStatus;

    const allowedNextStatuses =
      validTransitions[currentStatus];

    if (
      !allowedNextStatuses ||
      !allowedNextStatuses.includes(targetStatus)
    ) {
      throw new BadRequestException(
        `Invalid status transition from ${serviceRequest.status} to ${targetStatus}`,
      );
    }

    const updatedRequest =
      await this.prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.serviceRequest.update({
              where: {
                id,
              },

              data: {
                status: targetStatus,
              },
            });

          await tx.serviceRequestStatusHistory.create({
            data: {
              serviceRequestId: id,
              fromStatus: currentStatus,
              toStatus: targetStatus,
              changedByUserId: handlerId,
            },
          });

          return updated;
        },
      );

    if (
      targetStatus ===
      ServiceRequestStatus.COMPLETED
    ) {
      try {
        await this.notificationsService
          .sendRequestCompletedEmail({
            employeeEmail:
              serviceRequest.employee.email,

            employeeName:
              serviceRequest.employee.name,

            requestId:
              serviceRequest.id,

            requestTitle:
              serviceRequest.title,
          });
      } catch (error) {
        console.error(
          'Failed to send request completion email',
          error,
        );
      }
    }

    return updatedRequest;
  }

  async findByDepartment(
    departmentId: number | null,
  ) {
    if (departmentId === null) {
      throw new ForbiddenException(
        'Handler is not assigned to a department',
      );
    }

    return this.prisma.serviceRequest.findMany({
      where: {
        departmentId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async assignToHandler(
    requestId: number,
    handlerId: number,
    handlerDepartmentId: number | null,
  ) {
    if (handlerDepartmentId === null) {
      throw new ForbiddenException(
        'Handler is not assigned to a department',
      );
    }

    const serviceRequest =
      await this.findOne(requestId);

    if (
      serviceRequest.departmentId !==
      handlerDepartmentId
    ) {
      throw new ForbiddenException(
        'Handler cannot claim a request from another department',
      );
    }

    if (serviceRequest.handlerId !== null) {
      throw new BadRequestException(
        'Service request is already assigned',
      );
    }

    return this.prisma.serviceRequest.update({
      where: {
        id: requestId,
      },

      data: {
        handlerId,
      },
    });
  }

  async findByEmployee(
    employeeId: number,
  ) {
    return this.prisma.serviceRequest.findMany({
      where: {
        employeeId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findRequestDetails(
    id: number,
    user: {
      id: number;
      role: string;
      departmentId: number | null;
    },
  ) {
    const serviceRequest =
      await this.prisma.serviceRequest.findUnique({
        where: {
          id,
        },

        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },

          handler: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          statusHistory: {
            orderBy: {
              createdAt: 'asc',
            },

            include: {
              changedByUser: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

    if (!serviceRequest) {
      throw new NotFoundException(
        `Service request with id ${id} not found`,
      );
    }

    if (
      user.role === 'EMPLOYEE' &&
      serviceRequest.employeeId !== user.id
    ) {
      throw new ForbiddenException(
        'You can only view your own service requests',
      );
    }

    if (
      user.role === 'HANDLER' &&
      serviceRequest.departmentId !==
        user.departmentId
    ) {
      throw new ForbiddenException(
        'You can only view requests from your department',
      );
    }

    return serviceRequest;
  }
}