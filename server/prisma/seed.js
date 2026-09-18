import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const password = "ChangeMe@123";

  const hashedPassword = await bcrypt.hash(password, 12);

  const director = await prisma.user.upsert({
    where: {
      email: "director@viavistas.co.in",
    },

    update: {},

    create: {
      name: "ViaVistas Director",
      email: "director@viavistas.co.in",
      password: hashedPassword,
      role: "DIRECTOR",
      isActive: true,
    },
  });

  console.log("Director account created successfully:");
  console.log({
    id: director.id,
    name: director.name,
    email: director.email,
    role: director.role,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });