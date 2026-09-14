import {PrismaClient} from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    await prisma.serviceRequest.deleteMany();
    await prisma.serviceRequest.create({
        data: {
            id: 1,
            employeeId: 101,
            departmentId: 1,
            handlerId: 201,
            title: 'Laptop Issue',
            description: 'My laptop is not turning on.',
            status: 'submitted',
        },
    });
}
main().then(async () => {
    await prisma.$disconnect();
}).catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});