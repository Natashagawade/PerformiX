import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning database...')
  await prisma.auditLog.deleteMany()
  await prisma.escalation.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.checkIn.deleteMany()
  await prisma.sharedGoal.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Database cleaned. All users and goals removed.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
