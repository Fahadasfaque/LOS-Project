import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/db';

async function main() {
  const defaultUsers = [
    {
      email: 'admin@los.com',
      firstName: 'System',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      password: 'admin123',
    },
    {
      email: 'officer@los.com',
      firstName: 'John',
      lastName: 'Officer',
      role: Role.LOAN_OFFICER,
      password: 'officer123',
    },
    {
      email: 'analyst@los.com',
      firstName: 'Sarah',
      lastName: 'Analyst',
      role: Role.CREDIT_ANALYST,
      password: 'analyst123',
    },
    {
      email: 'approver@los.com',
      firstName: 'David',
      lastName: 'Approver',
      role: Role.APPROVER,
      password: 'approver123',
    },
  ];

  console.log('Seeding database with default user accounts...');

  for (const item of defaultUsers) {
    const hashedPassword = await bcrypt.hash(item.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        firstName: item.firstName,
        lastName: item.lastName,
        role: item.role,
        password: hashedPassword,
        isActive: true,
      },
      create: {
        email: item.email,
        firstName: item.firstName,
        lastName: item.lastName,
        role: item.role,
        password: hashedPassword,
        isActive: true,
      },
    });
    
    console.log(`Upserted user: ${user.email} (${user.role})`);
  }

  console.log('Seeding process complete.');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
