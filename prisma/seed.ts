import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { menuItems } from "../lib/menu-data";

// Load .env.local
config({ path: ".env.local" });

// Prisma 7 requires adapter
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // Создаём категории
  const categories = [
    { slug: "sushi", title: "Sushi & Rolls", order: 1, isActive: true },
    { slug: "wok", title: "Wok", order: 2, isActive: true },
    { slug: "ramen", title: "Ramen", order: 3, isActive: true },
  ];

  console.log("📦 Creating categories...");
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    console.log(`  ✓ ${cat.title}`);
  }

  // Загружаем все категории с их ID
  const dbCategories = await prisma.category.findMany();
  const categoryMap = new Map(dbCategories.map((c) => [c.slug, c.id]));

  console.log("\n🍱 Creating menu items...");
  let count = 0;

  for (const item of menuItems) {
    const categoryId = categoryMap.get(item.category);
    if (!categoryId) {
      console.warn(`  ⚠️  Category not found for: ${item.name}`);
      continue;
    }

    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {
        title: item.name,
        description: item.description,
        price: item.price * 100, // Convert to cents
        image: item.image,
        isAvailable: true,
      },
      create: {
        id: item.id,
        title: item.name,
        description: item.description,
        price: item.price * 100, // Convert to cents
        image: item.image,
        isAvailable: true,
        categoryId,
      },
    });
    count++;
    console.log(`  ✓ ${item.name} (${item.price} zł)`);
  }

  console.log(`\n✅ Seed completed!`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Menu items: ${count}`);

  // Показываем статистику
  const stats = await Promise.all([
    prisma.category.count(),
    prisma.menuItem.count(),
  ]);
  console.log(`\n📊 Database stats:`);
  console.log(`   Categories in DB: ${stats[0]}`);
  console.log(`   Menu items in DB: ${stats[1]}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
