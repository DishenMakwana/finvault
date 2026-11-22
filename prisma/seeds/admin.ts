import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

export const adminSeed = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@finvault.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const saltRounds = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 12;

    const hashedPassword = await bcrypt.hash(
      adminPassword,
      isNaN(saltRounds) ? 12 : saltRounds
    );

    const adminData = {
      email: adminEmail,
      name: 'Admin User',
      password: hashedPassword,
    };

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: adminData,
      create: adminData,
    });

    // Ensure the admin has a default house so they can immediately track cash
    const existingHouse = await prisma.house.findFirst({
      where: { userId: admin.id, deletedAt: null },
    });

    if (!existingHouse) {
      await prisma.house.create({
        data: {
          userId: admin.id,
          name: 'Main House',
          initialCash: 0,
        },
      });
    }

    console.debug(`Admin seeded successfully (${adminEmail})`);
  } catch (error: any) {
    console.error('Error Seeding Admin : ', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};
