import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.department.upsert({
    where: {
      id: 1,
    },
    update: {
      name: 'IT',
    },
    create: {
      id: 1,
      name: 'IT',
    },
  });
  await prisma.department.upsert({
    where: {
      id: 2,
    },
    update: {
      name: 'HR',
    },
    create: {
      id: 2,
      name: 'HR',
    },
  });
  await prisma.department.upsert({
    where: {
      id: 3,
    },
    update: {
      name: 'Finance',
    },
    create: {
      id: 3,
      name: 'Finance',
    },
  });
  console.log('Departments seeded successfully.');
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