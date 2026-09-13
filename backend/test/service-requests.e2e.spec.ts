import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import request from 'supertest';
import   {INestApplication, ValidationPipe} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {AppModule} from '../src/app.module';
import {PrismaService} from '../src/prisma/prisma.service';
import {ServiceRequestStatus} from '../src/service-requests/enum/service-request-status.enum';

describe('Service Request E2E', () =>{
    let app: INestApplication;
    let prisma: PrismaService;
    let requestId: number;
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                transform: true,
            }),
        );
        await app.init();
        prisma = app.get(PrismaService);
        await prisma.serviceRequest.deleteMany();
        const created = await prisma.serviceRequest.create({
            data: {
                employeeId: 101,
                departmentId: 1,
                handlerId: 201,
                title: 'E2E Test Request',
                description: 'Used to verify the full API flow.',
                status: ServiceRequestStatus.SUBMITTED,
            },
        });
        requestId = created.id;
    });
    afterAll(async () =>{
        await prisma.serviceRequest.deleteMany();
        await app.close();
    });
    it('should allow the assigned handler to move a request to in_progress', async () => {
        const response = await request(app.getHttpServer())
            .patch(`/service-requests/${requestId}/status`)
            .send({ status: ServiceRequestStatus.IN_PROGRESS, handlerId: 201 })
            .expect(200);
        expect(response.body.status).toBe(ServiceRequestStatus.IN_PROGRESS);
        expect(response.body.handlerId).toBe(201);
        const persisted = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
        expect(persisted?.status).toBe(ServiceRequestStatus.IN_PROGRESS);
    })
})