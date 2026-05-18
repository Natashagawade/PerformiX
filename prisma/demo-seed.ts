import { PrismaClient, Role, GoalStatus, GoalType, UoM, CyclePhase, CycleStatus, CheckInStatus, AuditAction } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding PerformiX with demo data...')

  // Departments
  const depts = await Promise.all([
    prisma.department.upsert({ where: { name: 'Sales' }, update: {}, create: { name: 'Sales' } }),
    prisma.department.upsert({ where: { name: 'Engineering' }, update: {}, create: { name: 'Engineering' } }),
    prisma.department.upsert({ where: { name: 'Marketing' }, update: {}, create: { name: 'Marketing' } }),
    prisma.department.upsert({ where: { name: 'Finance' }, update: {}, create: { name: 'Finance' } }),
    prisma.department.upsert({ where: { name: 'People & HR' }, update: {}, create: { name: 'People & HR' } }),
    prisma.department.upsert({ where: { name: 'Operations' }, update: {}, create: { name: 'Operations' } }),
  ])

  const adminPw = await bcrypt.hash('admin123', 12)
  const managerPw = await bcrypt.hash('manager123', 12)
  const employeePw = await bcrypt.hash('employee123', 12)

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@performix.com' },
    update: { passwordHash: adminPw },
    create: {
      email: 'admin@performix.com',
      name: 'Alice Admin',
      passwordHash: adminPw,
      role: Role.ADMIN,
      departmentId: depts[4].id, // HR
    },
  })

  // Managers
  const salesManager = await prisma.user.upsert({
    where: { email: 'manager@performix.com' },
    update: { passwordHash: managerPw },
    create: {
      email: 'manager@performix.com',
      name: 'Michael Manager',
      passwordHash: managerPw,
      role: Role.MANAGER,
      departmentId: depts[0].id, // Sales
    },
  })

  const engManager = await prisma.user.upsert({
    where: { email: 'eng.manager@performix.com' },
    update: { passwordHash: managerPw },
    create: {
      email: 'eng.manager@performix.com',
      name: 'Sarah Engineering Lead',
      passwordHash: managerPw,
      role: Role.MANAGER,
      departmentId: depts[1].id, // Engineering
    },
  })

  // Employees in Sales
  const employee = await prisma.user.upsert({
    where: { email: 'employee@performix.com' },
    update: { passwordHash: employeePw },
    create: {
      email: 'employee@performix.com',
      name: 'Emma Employee',
      passwordHash: employeePw,
      role: Role.EMPLOYEE,
      departmentId: depts[0].id,
      managerId: salesManager.id,
    },
  })

  const salesRep2 = await prisma.user.upsert({
    where: { email: 'sales2@performix.com' },
    update: { passwordHash: employeePw },
    create: {
      email: 'sales2@performix.com',
      name: 'David Sales Rep',
      passwordHash: employeePw,
      role: Role.EMPLOYEE,
      departmentId: depts[0].id,
      managerId: salesManager.id,
    },
  })

  // Employees in Engineering
  const dev1 = await prisma.user.upsert({
    where: { email: 'dev1@performix.com' },
    update: { passwordHash: employeePw },
    create: {
      email: 'dev1@performix.com',
      name: 'Alex Developer',
      passwordHash: employeePw,
      role: Role.EMPLOYEE,
      departmentId: depts[1].id,
      managerId: engManager.id,
    },
  })

  const dev2 = await prisma.user.upsert({
    where: { email: 'dev2@performix.com' },
    update: { passwordHash: employeePw },
    create: {
      email: 'dev2@performix.com',
      name: 'Chris Frontend Eng',
      passwordHash: employeePw,
      role: Role.EMPLOYEE,
      departmentId: depts[1].id,
      managerId: engManager.id,
    },
  })

  // Employees in Marketing
  const marketingRep = await prisma.user.upsert({
    where: { email: 'marketing@performix.com' },
    update: { passwordHash: employeePw },
    create: {
      email: 'marketing@performix.com',
      name: 'Jessica Marketer',
      passwordHash: employeePw,
      role: Role.EMPLOYEE,
      departmentId: depts[2].id,
    },
  })

  // Cycle
  const cycle = await prisma.cycle.upsert({
    where: { id: 'cycle-fy2025' },
    update: {},
    create: {
      id: 'cycle-fy2025',
      name: 'FY2025 Annual Cycle',
      phase: CyclePhase.Q2,
      status: CycleStatus.ACTIVE,
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
    },
  })

  // Goals for Emma
  const goalsData = [
    { title: 'Increase Outbound Sales by 25%', thrustArea: 'Revenue', uom: UoM.PERCENTAGE, target: 25, weightage: 40, status: GoalStatus.APPROVED, isLocked: true, deadline: new Date('2025-09-30') },
    { title: 'Improve Client Retention Rate', thrustArea: 'Customer Success', uom: UoM.NUMERIC, target: 95, weightage: 30, status: GoalStatus.APPROVED, isLocked: true, deadline: new Date('2025-12-31') },
    { title: 'Complete Advanced Negotiation Training', thrustArea: 'Development', uom: UoM.TIMELINE, target: 100, weightage: 30, status: GoalStatus.PENDING, isLocked: false, deadline: new Date('2025-07-15') },
  ]

  for (const g of goalsData) {
    const existing = await prisma.goal.findFirst({ where: { ownerId: employee.id, title: g.title } })
    if (!existing) {
      const goal = await prisma.goal.create({
        data: {
          ...g,
          ownerId: employee.id,
          cycleId: cycle.id,
          approverId: g.status === GoalStatus.APPROVED ? salesManager.id : undefined,
          approvedAt: g.status === GoalStatus.APPROVED ? new Date() : undefined,
          submittedAt: new Date(),
        },
      })

      // Add a check-in for the first goal
      if (g.title.includes('Sales')) {
        await prisma.checkIn.create({
          data: {
            goalId: goal.id,
            cycleId: cycle.id,
            userId: employee.id,
            quarter: 'Q1',
            plannedTarget: 10,
            actualAchieved: 12,
            status: CheckInStatus.ON_TRACK,
            progressScore: 1,
            employeeComment: 'Exceeded Q1 expectations due to new outreach campaign.',
            managerFeedback: 'Great work! Keep it up.',
          },
        })
      }
    }
  }

  // Goals for Alex (Developer)
  await prisma.goal.create({
    data: {
      title: 'Ship PerformiX v2.0',
      thrustArea: 'Product',
      uom: UoM.TIMELINE,
      target: 100,
      weightage: 50,
      status: GoalStatus.APPROVED,
      isLocked: true,
      deadline: new Date('2025-10-31'),
      ownerId: dev1.id,
      cycleId: cycle.id,
      approverId: engManager.id,
      approvedAt: new Date(),
      submittedAt: new Date()
    }
  })

  console.log('✅ Multiple departments and employees seeded!')
  console.log('Passwords have been set to admin123, manager123, employee123.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
