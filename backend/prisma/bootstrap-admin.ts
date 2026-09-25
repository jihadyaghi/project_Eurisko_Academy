import {PrismaClient, UserRole} from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main(){
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name =  process.env.ADMIN_NAME ?? 'System Admin';
    if (!email || !password){
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment');
    }
    const existingAdmin = await prisma.user.findUnique({where: {email}});
    if (existingAdmin){
        console.log('Admin already exists.');
        return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role: UserRole.ADMIN,
            departmentId: null
        }
    });
    console.log('Admin created successfully.');
}
main()
.catch((error) => {
    console.error(error);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
})