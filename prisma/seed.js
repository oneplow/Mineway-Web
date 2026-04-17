const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Plans...");

  // Delete all existing plans to avoid duplicates in this simple seed
  await prisma.plan.deleteMany({});

  const free = await prisma.plan.create({
    data: {
      name: "free",
      displayName: "Free Trial",
      pricePoints: 0,
      bandwidthGB: 5,
      maxPlayers: 5,
      maxKeys: 1,
      maxNodes: 1,
      isPopular: false,
      isActive: true,
      features: [
        "ทดลองใช้ฟรีไม่มีกำหนด",
        "จำกัดแบนด์วิดท์ 5 GB/เดือน",
        "จำกัดผู้เล่นสูงสุด 5 คน",
        "Support ระดับชุมชน"
      ]
    }
  });
  
  const starter = await prisma.plan.create({
    data: {
      name: "starter",
      displayName: "Starter",
      pricePoints: 100,
      bandwidthGB: 50,
      maxPlayers: 20,
      maxKeys: 1,
      maxNodes: 1,
      isPopular: false,
      isActive: true,
      features: [
        "30 วัน อายุการใช้งาน",
        "ระบบป้องกัน Basic DDoS",
        "Support ระดับปกติ"
      ]
    }
  });

  const pro = await prisma.plan.create({
    data: {
      name: "pro",
      displayName: "Pro",
      pricePoints: 300,
      bandwidthGB: 200,
      maxPlayers: 100,
      maxKeys: 3,
      maxNodes: 3,
      isPopular: true,
      isActive: true,
      features: [
        "30 วัน อายุการใช้งาน",
        "ระบบป้องกัน Advanced DDoS",
        "แบนด์วิดท์ระดับพรีเมียม",
        "Priority Support"
      ]
    }
  });

  const enterprise = await prisma.plan.create({
    data: {
      name: "enterprise",
      displayName: "Enterprise",
      pricePoints: 1000,
      bandwidthGB: 1000, // 1TB
      maxPlayers: 0, // 0 = Unlimited
      maxKeys: 10,
      maxNodes: 10,
      isPopular: false,
      isActive: true,
      features: [
        "อายุการใช้งาน 30 วัน",
        "เจาะจง IP ได้ (Dedicated IP)",
        "ระบบทนทานขั้นสูง",
        "บริการแก้ไขปัญหาทันที (24/7)"
      ]
    }
  });

  console.log("Seeding finished successfully.");
  console.log({ free, starter, pro, enterprise });
}

main()
  .catch((e) => {
    console.error("Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
