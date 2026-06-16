import { PrismaClient, type Intensity, type MoodLevel } from '@prisma/client';

/**
 * Seeds realistic data so the app has material from the first run (counters with
 * history, a populated mood calendar). Ports the old in-memory mock, in English.
 * Idempotent: wipes the relevant tables first, then recreates everything.
 */

const prisma = new PrismaClient();

function daysAgo(days: number, hour = 12, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const TRIGGER_NAMES = [
  'Stress',
  'Anxiety',
  'Boredom',
  'Loneliness',
  'Peer pressure',
  'Sadness',
  'Tiredness',
  'Anger',
  'Celebration',
  'Insomnia',
  'Habit',
  'Craving',
];

const FACTOR_NAMES = [
  'Sleep',
  'Work',
  'Exercise',
  'Social',
  'Diet',
  'Health',
  'Family',
  'Partner',
  'Money',
  'Leisure',
];

type SeedEvent = {
  key: string;
  days: number;
  hour: number;
  trigger: string;
  intensity: Intensity;
  mood: MoodLevel;
  notes?: string;
};

const SEED_EVENTS: SeedEvent[] = [
  // Alcohol → current streak ~9 days.
  { key: 'alcohol', days: 60, hour: 22, trigger: 'Celebration', intensity: 'MODERATE', mood: 'GOOD', notes: "A friend's birthday." },
  { key: 'alcohol', days: 28, hour: 21, trigger: 'Stress', intensity: 'INTENSE', mood: 'BAD', notes: 'Rough week at work.' },
  { key: 'alcohol', days: 9, hour: 20, trigger: 'Peer pressure', intensity: 'MILD', mood: 'OKAY', notes: 'Barbecue: was offered and accepted.' },
  // Tobacco → current streak ~3 days.
  { key: 'tobacco', days: 70, hour: 13, trigger: 'Habit', intensity: 'MILD', mood: 'OKAY' },
  { key: 'tobacco', days: 45, hour: 16, trigger: 'Anxiety', intensity: 'MODERATE', mood: 'BAD' },
  { key: 'tobacco', days: 30, hour: 11, trigger: 'Boredom', intensity: 'MILD', mood: 'OKAY' },
  { key: 'tobacco', days: 16, hour: 19, trigger: 'Stress', intensity: 'MODERATE', mood: 'BAD' },
  { key: 'tobacco', days: 3, hour: 8, trigger: 'Tiredness', intensity: 'MILD', mood: 'OKAY', notes: 'Hard morning, had one.' },
  // Intimate habit → current streak ~7 days.
  { key: 'intimate', days: 30, hour: 23, trigger: 'Boredom', intensity: 'MODERATE', mood: 'OKAY' },
  { key: 'intimate', days: 18, hour: 0, trigger: 'Insomnia', intensity: 'MILD', mood: 'BAD' },
  { key: 'intimate', days: 7, hour: 1, trigger: 'Loneliness', intensity: 'INTENSE', mood: 'BAD', notes: 'Tough night.' },
  // Sugar → no relapses (streak runs from its start, ~30 days).
];

async function main() {
  // Wipe (order matters for FKs). Implicit M-N join rows go with their parents.
  await prisma.relapseEvent.deleteMany();
  await prisma.relapse.deleteMany();
  await prisma.moodEntry.deleteMany();
  await prisma.moodFactor.deleteMany();
  await prisma.trigger.deleteMany();

  // Catalogs.
  await prisma.trigger.createMany({
    data: TRIGGER_NAMES.map((name) => ({ name, isSystem: true, createdAt: daysAgo(200) })),
  });
  await prisma.moodFactor.createMany({
    data: FACTOR_NAMES.map((name) => ({ name, isSystem: true, createdAt: daysAgo(200) })),
  });

  const triggers = await prisma.trigger.findMany();
  const factors = await prisma.moodFactor.findMany();
  const triggerId = (name: string) => triggers.find((t) => t.name === name)!.id;
  const factorId = (name: string) => factors.find((f) => f.name === name)!.id;

  // Behaviors.
  const behaviors = [
    { key: 'alcohol', name: 'Alcohol', description: 'No alcoholic drinks.', color: '#7c3aed', icon: 'Wine', startDays: 75, startHour: 9 },
    { key: 'tobacco', name: 'Tobacco', description: 'Quit smoking.', color: '#ef4444', icon: 'Cigarette', startDays: 120, startHour: 8 },
    { key: 'intimate', name: 'Intimate habit', description: 'Reduce compulsive masturbation.', color: '#ec4899', icon: 'HeartCrack', startDays: 40, startHour: 10 },
    { key: 'sugar', name: 'Sugar', description: 'Cut added sugar.', color: '#f59e0b', icon: 'Candy', startDays: 30, startHour: 7 },
  ];

  const relapseIdByKey = new Map<string, string>();
  for (const b of behaviors) {
    const start = daysAgo(b.startDays, b.startHour);
    const created = await prisma.relapse.create({
      data: {
        name: b.name,
        description: b.description,
        color: b.color,
        icon: b.icon,
        startDate: start,
        createdAt: start,
      },
    });
    relapseIdByKey.set(b.key, created.id);
  }

  // Relapse events.
  for (const e of SEED_EVENTS) {
    const when = daysAgo(e.days, e.hour);
    await prisma.relapseEvent.create({
      data: {
        relapseId: relapseIdByKey.get(e.key)!,
        date: when,
        triggerId: triggerId(e.trigger),
        intensity: e.intensity,
        moodLevel: e.mood,
        notes: e.notes ?? null,
        createdAt: when,
      },
    });
  }

  // ~30 days of moods (1–3 per day) for the calendar, trend and timeline.
  const pattern: MoodLevel[] = [
    'GOOD', 'OKAY', 'VERY_GOOD', 'BAD', 'GOOD',
    'OKAY', 'VERY_BAD', 'GOOD', 'VERY_GOOD', 'OKAY',
    'BAD', 'GOOD', 'OKAY', 'VERY_GOOD', 'GOOD',
  ];
  const factorsByLevel: Record<MoodLevel, string[]> = {
    VERY_GOOD: ['Exercise', 'Social', 'Sleep'],
    GOOD: ['Work', 'Leisure'],
    OKAY: ['Work', 'Sleep'],
    BAD: ['Money', 'Health'],
    VERY_BAD: ['Health', 'Sleep'],
  };
  const noteByLevel: Partial<Record<MoodLevel, string>> = {
    VERY_GOOD: 'Good day, full of energy.',
    BAD: 'Heavy day.',
    VERY_BAD: 'Really struggled today.',
  };

  for (let d = 29; d >= 0; d--) {
    const count = 1 + (d % 3 === 0 ? 1 : 0) + (d % 7 === 0 ? 1 : 0);
    for (let k = 0; k < count; k++) {
      const level = pattern[(d * 2 + k) % pattern.length];
      const names = factorsByLevel[level];
      const when = daysAgo(d, 9 + k * 5, 30);
      await prisma.moodEntry.create({
        data: {
          date: when,
          level,
          note: k === 0 ? (noteByLevel[level] ?? null) : null,
          createdAt: when,
          factors: { connect: names.map((n) => ({ id: factorId(n) })) },
        },
      });
    }
  }

  console.log('Seed complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
