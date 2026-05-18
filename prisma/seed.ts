import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Initializing PerformiX workspace...')

  // Create default departments
  const depts = [
    'Sales',
    'Engineering',
    'Marketing',
    'Finance',
    'People & HR',
    'Operations',
  ]

  for (const dept of depts) {
    await prisma.department.upsert({
      where: { name: dept },
      update: {},
      create: { name: dept },
    })
  }

  console.log('✅ Default departments created.')
  console.log('✨ Workspace initialization complete!')
  console.log('\n👉 Next steps:')
  console.log('   1. Start the application (npm run dev)')
  console.log('   2. Visit http://localhost:3000/auth/setup to create the first admin account')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
