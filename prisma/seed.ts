import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Skills
  const skills = [
    { id: 'skill-001', name: 'JavaScript', category: 'Programming' },
    { id: 'skill-002', name: 'TypeScript', category: 'Programming' },
    { id: 'skill-003', name: 'React', category: 'Framework' },
    { id: 'skill-004', name: 'Next.js', category: 'Framework' },
    { id: 'skill-005', name: 'Node.js', category: 'Backend' },
    { id: 'skill-006', name: 'Python', category: 'Programming' },
    { id: 'skill-007', name: 'Django', category: 'Framework' },
    { id: 'skill-008', name: 'UI/UX Design', category: 'Design' },
    { id: 'skill-009', name: 'Graphic Design', category: 'Design' },
    { id: 'skill-010', name: 'Content Writing', category: 'Writing' },
    { id: 'skill-011', name: 'SEO', category: 'Marketing' },
    { id: 'skill-012', name: 'Digital Marketing', category: 'Marketing' },
  ];

  let skillsCreated = 0;
  for (const skill of skills) {
    try {
      await prisma.skill.upsert({
        where: { id: skill.id },
        update: {},
        create: skill,
      });
      skillsCreated++;
    } catch (error) {
      console.warn(`⚠️  Skill ${skill.name} already exists, skipping...`);
    }
  }

  console.log(`✅ ${skillsCreated} skills seeded successfully`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Database seeding completed!');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
