import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {PrismaService} from '../prisma/prisma.service';
import {ServiceRequestsService} from './service-requests.service';
import {ServiceRequestStatus} from './enum/service-request-status.enum';

describe('ServiceRequestsService Integration', () => {
    const prisma = new PrismaService();
    const service = new ServiceRequestsService(prisma);
    beforeAll(async ()=> {
        await prisma.$connect();
        await prisma.serviceRequest.deleteMany();
        await prisma.serviceRequest.create({
            data: {
                employeeId: 101,
                departmentId: 1,
                handlerId: 201,
                title: 'Laptop Issue',
                description: 'My laptop is not turning on.',
                status: ServiceRequestStatus.SUBMITTED,
            }
        });
    });
    afterAll(async () => {
        await prisma.serviceRequest.deleteMany();
        await prisma.$disconnect();
    });
    it('should persist a valid status transition in SQLite', async ()=>{
        const request = await prisma.serviceRequest.findFirst();
        expect(request).not.toBeNull();
        const updated = await service.transitionStatus(request!.id, ServiceRequestStatus.IN_PROGRESS, 201);
        expect(updated.status).toBe(ServiceRequestStatus.IN_PROGRESS);
        const persisted = await prisma.serviceRequest.findUnique({where: {id: request!.id}});
        expect(persisted?.status).toBe(ServiceRequestStatus.IN_PROGRESS);
    })
})