import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.serviceRequestStatusHistory.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  const itDepartment = await prisma.department.create({
    data: {
      id: 1,
      name: 'IT',
    },
  });
  const hrDepartment = await prisma.department.create({
    data: {
      id: 2,
      name: 'HR',
    },
  });
  const financeDepartment = await prisma.department.create({
    data: {
      id: 3,
      name: 'Finance',
    },
  });
  const passwordHash = await bcrypt.hash('password123', 10);
  const employee = await prisma.user.create({
    data: {
      id: 101,
      name: 'Demo Employee',
      email: 'employee@example.com',
      passwordHash,
      role: UserRole.EMPLOYEE,
    },
  });
  const itHandler = await prisma.user.create({
    data: {
      id: 201,
      name: 'IT Handler',
      email: 'it.handler@example.com',
      passwordHash,
      role: UserRole.HANDLER,
      departmentId: itDepartment.id,
    },
  });
  await prisma.user.create({
    data: {
      id: 202,
      name: 'HR Handler',
      email: 'hr.handler@example.com',
      passwordHash,
      role: UserRole.HANDLER,
      departmentId: hrDepartment.id,
    },
  });
  await prisma.user.create({
    data: {
      id: 203,
      name: 'Finance Handler',
      email: 'finance.handler@example.com',
      passwordHash,
      role: UserRole.HANDLER,
      departmentId: financeDepartment.id,
    },
  });
  await prisma.serviceRequest.create({
    data: {
      id: 1,
      employeeId: employee.id,
      departmentId: itDepartment.id,
      handlerId: itHandler.id,
      title: 'Laptop Issue',
      description: 'My laptop is not turning on.',
      category: 'hardware',
      priority: 'normal',
      status: 'submitted',
    },
  });
  console.log('Database seeded successfully.');
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });