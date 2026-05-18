import { PrismaClient, Role, GoalStatus, GoalType, UoM, CyclePhase, CycleStatus, CheckInStatus, AuditAction } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding PerformiX database...')

  // Departments
  const depts = await Promise.all([
    prisma.department.upsert({ where: { name: 'Sales' }, update: {}, create: { name: 'Sales' } }),
    prisma.department.upsert({ where: { name: 'Engineering' }, update: {}, create: { name: 'Engineering' } }),
    prisma.department.upsert({ where: { name: 'Marketing' }, update: {}, create: { name: 'Marketing' } }),
    prisma.department.upsert({ where: { name: 'Finance' }, update: {}, create: { name: 'Finance' } }),
    prisma.department.upsert({ where: { name: 'People & HR' }, update: {}, create: { name: 'People & HR' } }),
    prisma.department.upsert({ where: { name: 'Operations' }, update: {}, create: { name: 'Operations' } }),
  ])

  const pw = await bcrypt.hash('GoalSync123', 12)

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@performix.com' },
    update: {},
    create: {
      email: 'admin@performix.com',
      name: 'Admin HR',
      passwordHash: pw,
      role: Role.ADMIN,
      departmentId: depts[4].id,
    },
  })

  // Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@performix.com' },
    update: {},
    create: {
      email: 'manager@performix.com',
      name: 'Mike Thompson',
      passwordHash: pw,
      role: Role.MANAGER,
      departmentId: depts[0].id,
    },
  })

  // Employee
  const employee = await prisma.user.upsert({
    where: { email: 'employee@performix.com' },
    update: {},
    create: {
      email: 'employee@performix.com',
      name: 'Sarah Employee',
      passwordHash: pw,
      role: Role.EMPLOYEE,
      departmentId: depts[0].id,
      managerId: manager.id,
    },
  })

  // More employees
  const employees = await Promise.all([
    prisma.user.upsert({ where: { email: 'alex@performix.com' }, update: {}, create: { email: 'alex@performix.com', name: 'Alex Johnson', passwordHash: pw, role: Role.EMPLOYEE, departmentId: depts[0].id, managerId: manager.id } }),
    prisma.user.upsert({ where: { email: 'maria@performix.com' }, update: {}, create: { email: 'maria@performix.com', name: 'Maria Garcia', passwordHash: pw, role: Role.EMPLOYEE, departmentId: depts[1].id, managerId: manager.id } }),
    prisma.user.upsert({ where: { email: 'david@performix.com' }, update: {}, create: { email: 'david@performix.com', name: 'David Kim', passwordHash: pw, role: Role.EMPLOYEE, departmentId: depts[4].id, managerId: manager.id } }),
    prisma.user.upsert({ where: { email: 'emma@performix.com' }, update: {}, create: { email: 'emma@performix.com', name: 'Emma Wilson', passwordHash: pw, role: Role.EMPLOYEE, departmentId: depts[2].id, managerId: manager.id } }),
  ])

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

  // Goals for Sarah
  const goalsData = [
    { title: 'Increase Sales Revenue', thrustArea: 'Revenue Growth', uom: UoM.PERCENTAGE, target: 25, weightage: 30, status: GoalStatus.APPROVED, isLocked: true, deadline: new Date('2025-09-30') },
    { title: 'Improve Customer NPS Score', thrustArea: 'Customer Success', uom: UoM.NUMERIC, target: 80, weightage: 25, status: GoalStatus.APPROVED, isLocked: true, deadline: new Date('2025-12-31') },
    { title: 'Launch Product v2.0', thrustArea: 'Product Delivery', uom: UoM.TIMELINE, target: 100, weightage: 20, status: GoalStatus.APPROVED, isLocked: true, goalType: GoalType.SHARED, isShared: true, deadline: new Date('2025-10-15') },
    { title: 'Reduce Operational Costs', thrustArea: 'Efficiency', uom: UoM.PERCENTAGE, target: 15, weightage: 15, status: GoalStatus.PENDING, isLocked: false, deadline: new Date('2025-12-31') },
    { title: 'Complete Leadership Training', thrustArea: 'Development', uom: UoM.TIMELINE, target: 100, weightage: 10, status: GoalStatus.APPROVED, isLocked: true, deadline: new Date('2025-06-30') },
  ]

  for (const g of goalsData) {
    const existing = await prisma.goal.findFirst({ where: { ownerId: employee.id, title: g.title } })
    if (!existing) {
      const goal = await prisma.goal.create({
        data: {
          ...g,
          ownerId: employee.id,
          cycleId: cycle.id,
          approverId: g.status === GoalStatus.APPROVED ? manager.id : undefined,
          approvedAt: g.status === GoalStatus.APPROVED ? new Date() : undefined,
          submittedAt: new Date(),
        },
      })

      // Check-ins for approved goals
      if (g.status === GoalStatus.APPROVED) {
        const achievement = Math.round(g.target * (Math.random() * 0.4 + 0.5))
        await prisma.checkIn.create({
          data: {
            goalId: goal.id,
            cycleId: cycle.id,
            userId: employee.id,
            quarter: 'Q1',
            plannedTarget: Math.round(g.target * 0.25),
            actualAchieved: Math.round(achievement * 0.4),
            status: CheckInStatus.COMPLETED,
            progressScore: Math.min(1, (achievement * 0.4) / (g.target * 0.25)),
            employeeComment: 'Good progress in Q1. On track to meet annual target.',
            managerFeedback: 'Strong start. Keep up the momentum.',
          },
        })
      }
    }
  }

  // Pending approvals (for manager)
  const pendingGoals = [
    { title: 'Reduce Operational Costs', thrustArea: 'Efficiency', uom: UoM.PERCENTAGE, target: 15, weightage: 15, deadline: new Date('2025-12-31'), owner: employees[0] },
    { title: 'Launch Mobile App', thrustArea: 'Product', uom: UoM.TIMELINE, target: 100, weightage: 25, deadline: new Date('2025-11-30'), owner: employees[1] },
    { title: 'Team Headcount Growth', thrustArea: 'People', uom: UoM.NUMERIC, target: 8, weightage: 20, deadline: new Date('2025-12-31'), owner: employees[2] },
  ]

  for (const pg of pendingGoals) {
    const existing = await prisma.goal.findFirst({ where: { ownerId: pg.owner.id, title: pg.title } })
    if (!existing) {
      await prisma.goal.create({
        data: {
          title: pg.title,
          thrustArea: pg.thrustArea,
          uom: pg.uom,
          target: pg.target,
          weightage: pg.weightage,
          deadline: pg.deadline,
          status: GoalStatus.PENDING,
          isLocked: false,
          ownerId: pg.owner.id,
          cycleId: cycle.id,
          submittedAt: new Date(),
        },
      })
    }
  }

  // Notifications
  const notifData = [
    { userId: employee.id, title: 'Goal Approved', message: 'Your goal "Increase Sales Revenue" has been approved by Mike Thompson.', type: 'approval' },
    { userId: employee.id, title: 'Check-in Reminder', message: 'Q2 check-in window opens in 3 days. Update your achievements.', type: 'reminder' },
    { userId: employee.id, title: 'Goal Returned', message: '"Market Expansion" returned for rework. Review manager comments.', type: 'rework' },
    { userId: manager.id, title: 'New Approval Request', message: 'Alex Johnson submitted a goal for your review.', type: 'approval_request' },
    { userId: manager.id, title: 'Escalation Alert', message: 'David Kim has not submitted goals yet. Cycle ends in 5 days.', type: 'escalation' },
  ]

  for (const n of notifData) {
    await prisma.notification.create({ data: n })
  }

  // Audit logs
  const auditData = [
    { action: AuditAction.GOAL_APPROVED, userId: manager.id, details: 'Approved "Increase Sales Revenue" for Sarah Employee' },
    { action: AuditAction.GOAL_SUBMITTED, userId: employee.id, details: 'Submitted "Reduce Operational Costs" for approval' },
    { action: AuditAction.ACHIEVEMENT_UPDATED, userId: employee.id, details: 'Q1 achievement updated for "Complete Leadership Training": 100%' },
    { action: AuditAction.GOAL_UNLOCKED, userId: admin.id, details: 'Unlocked "Launch Product v2.0" for target revision' },
    { action: AuditAction.GOAL_CREATED, userId: employee.id, details: 'Created "Improve Customer NPS Score"' },
    { action: AuditAction.CYCLE_CREATED, userId: admin.id, details: 'Created FY2025 Annual Cycle' },
  ]

  for (const a of auditData) {
    await prisma.auditLog.create({ data: a })
  }

  console.log('✅ Seed complete!')
  console.log('\n📧 Demo accounts:')
  console.log('   employee@performix.com  — Password: GoalSync123')
  console.log('   manager@performix.com   — Password: GoalSync123')
  console.log('   admin@performix.com     — Password: GoalSync123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
