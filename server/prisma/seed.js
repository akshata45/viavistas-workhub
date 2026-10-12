import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

/*
|--------------------------------------------------------------------------
| Prisma Connection
|--------------------------------------------------------------------------
*/

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

/*
|--------------------------------------------------------------------------
| Create / Update User
|--------------------------------------------------------------------------
|
| This function:
|
| 1. Hashes the password
| 2. Creates the user if the email does not exist
| 3. Updates the existing user if the email already exists
| 4. Makes sure the account is active
|
|--------------------------------------------------------------------------
*/

async function createUser({
  name,
  email,
  password,
  role,
}) {
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: {
      email,
    },

    /*
    |--------------------------------------------------------------------------
    | Existing User
    |--------------------------------------------------------------------------
    */

    update: {
      name,
      password: hashedPassword,
      role,
      isActive: true,
    },

    /*
    |--------------------------------------------------------------------------
    | New User
    |--------------------------------------------------------------------------
    */

    create: {
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    },
  });

  return user;
}

/*
|--------------------------------------------------------------------------
| Main Seed Function
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("");
  console.log("========================================");
  console.log("   ViaVistas WorkHub Database Seeding");
  console.log("========================================");
  console.log("");

  /*
  |--------------------------------------------------------------------------
  | 1. DIRECTOR
  |--------------------------------------------------------------------------
  */

  const director = await createUser({
    name: "ViaVistas Director",
    email: "director@viavistas.co.in",
    password: "ChangeMe@123",
    role: "DIRECTOR",
  });

  console.log("DIRECTOR CREATED / UPDATED");
  console.log("----------------------------------------");

  console.log({
    id: director.id,
    name: director.name,
    email: director.email,
    role: director.role,
    isActive: director.isActive,
  });

  console.log("");

  /*
  |--------------------------------------------------------------------------
  | 2. TEAM LEADER
  |--------------------------------------------------------------------------
  */

  const teamLeader = await createUser({
    name: "Sample Team Leader",
    email: "tl@viavistas.co.in",
    password: "ChangeMe@123",
    role: "TL",
  });

  console.log("TEAM LEADER CREATED / UPDATED");
  console.log("----------------------------------------");

  console.log({
    id: teamLeader.id,
    name: teamLeader.name,
    email: teamLeader.email,
    role: teamLeader.role,
    isActive: teamLeader.isActive,
  });

  console.log("");

  /*
  |--------------------------------------------------------------------------
  | 3. EMPLOYEE
  |--------------------------------------------------------------------------
  */

  const employee = await createUser({
    name: "Sample Employee",
    email: "employee@viavistas.co.in",
    password: "ChangeMe@123",
    role: "EMPLOYEE",
  });

  console.log("EMPLOYEE CREATED / UPDATED");
  console.log("----------------------------------------");

  console.log({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    isActive: employee.isActive,
  });

  console.log("");

  /*
  |--------------------------------------------------------------------------
  | FINISHED
  |--------------------------------------------------------------------------
  */

  console.log("========================================");
  console.log("   Seed completed successfully");
  console.log("========================================");

  console.log("");
  console.log("Login credentials");
  console.log("========================================");

  console.log("");
  console.log("DIRECTOR");
  console.log("Email    : director@viavistas.co.in");
  console.log("Password : ChangeMe@123");

  console.log("");
  console.log("TEAM LEADER");
  console.log("Email    : tl@viavistas.co.in");
  console.log("Password : ChangeMe@123");

  console.log("");
  console.log("EMPLOYEE");
  console.log("Email    : employee@viavistas.co.in");
  console.log("Password : ChangeMe@123");

  console.log("");
  console.log("========================================");
}

/*
|--------------------------------------------------------------------------
| Run Seed
|--------------------------------------------------------------------------
*/

main()
  .catch((error) => {
    console.error("");
    console.error("========================================");
    console.error("Seed failed");
    console.error("========================================");
    console.error("");

    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });