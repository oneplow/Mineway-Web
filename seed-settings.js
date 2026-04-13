const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const settings = [
  // ---- General / Identity ----
  { key: "siteName", value: "Mineway", label: "ชื่อแพลตฟอร์ม" },
  { key: "siteTagline", value: "Minecraft Server Gateway", label: "คำอธิบายสั้นของเว็บ (Tagline)" },
  { key: "siteDescription", value: "Expose your Minecraft server to the internet through our secure VPS tunnel.", label: "คำอธิบาย SEO (Meta Description)" },
  { key: "footerText", value: "2025 Mineway. All rights reserved.", label: "ข้อความ Footer" },

  // ---- Announcements ----
  { key: "homeAnnouncement", value: "พร้อมให้บริการแล้ววันนี้", label: "ข้อความ Badge หน้าแรก" },
  { key: "dashboardAnnouncement", value: "", label: "ประกาศในหน้า Dashboard (เว้นว่าง = ไม่แสดง)" },

  // ---- Social / Contact ----
  { key: "discordUrl", value: "", label: "ลิงก์ Discord Server" },
  { key: "contactEmail", value: "", label: "อีเมลติดต่อ" },

  // ---- Pricing / Logic ----
  // customPortPrice already seeded
  { key: "defaultTunnelExpiryDays", value: "30", label: "จำนวนวันหมดอายุ Tunnel (วัน)" },

  // ---- Maintenance ----
  { key: "maintenanceMode", value: "false", label: "โหมดปิดปรับปรุง (true/false)" },
  { key: "maintenanceMessage", value: "ระบบกำลังปรับปรุง กรุณากลับมาใหม่ภายหลัง", label: "ข้อความแสดงตอนปิดปรับปรุง" },
];

async function seed() {
  for (const s of settings) {
    await p.siteSetting.upsert({
      where: { key: s.key },
      update: {}, // don't overwrite existing values
      create: s,
    });
    console.log(`  Seeded: ${s.key} = "${s.value}"`);
  }
  console.log("Done seeding all settings.");
  await p.$disconnect();
}

seed().catch((e) => { console.error(e); p.$disconnect(); });
