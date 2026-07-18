import type { PrismaClient } from '@prisma/client';

/**
 * Seeds all categories (5 top-level + 35 subcategories) using idempotent upserts.
 * Shared between prisma/seed.ts and tests/global-setup.ts.
 *
 * Returns a `slug -> UUID` map so callers can store real category UUIDs in
 * seller profiles. SellerProfile.categories must hold UUIDs, not slugs: the Jobs
 * notification query (`notifyTopMatchedJobSellers`) and the targeted-feed
 * exclusivity query both match `categoryId` (a UUID) against this JSON array, so
 * a slug can never match (issue #179).
 */
export async function seedCategories(prisma: PrismaClient): Promise<Record<string, string>> {
  // ─── Top-level (MVP-enabled) ────────────────────────────────
  const products = await prisma.category.upsert({
    where: { slug: 'products' },
    update: {},
    create: {
      slug: 'products',
      name: 'Products',
      description: 'Buy and sell physical goods (local FREE, shipped with escrow)',
      icon: 'shopping_bag',
      sortOrder: 1,
      isActive: true,
      enabledInMvp: true,
    },
  });

  const services = await prisma.category.upsert({
    where: { slug: 'services' },
    update: {},
    create: {
      slug: 'services',
      name: 'Services',
      description: 'All service categories (home improvement, plumbing, cleaning, etc.)',
      icon: 'build',
      sortOrder: 2,
      isActive: true,
      enabledInMvp: true,
    },
  });

  const jobs = await prisma.category.upsert({
    where: { slug: 'jobs' },
    update: {},
    create: {
      slug: 'jobs',
      name: 'Jobs',
      description: 'Lead generation: companies pay per qualified candidate lead',
      icon: 'work',
      sortOrder: 3,
      isActive: true,
      enabledInMvp: true,
    },
  });

  // Top-level (Phase 2+)
  await prisma.category.upsert({
    where: { slug: 'inventory_wholesale' },
    update: {},
    create: {
      slug: 'inventory_wholesale',
      name: 'Inventory/Wholesale',
      description: 'B2B bulk orders and supplies',
      icon: 'inventory',
      sortOrder: 4,
      isActive: false,
      enabledInMvp: false,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'real_estate' },
    update: {},
    create: {
      slug: 'real_estate',
      name: 'Real Estate',
      description: 'Lead generation only (Coming Soon)',
      icon: 'home',
      sortOrder: 5,
      isActive: false,
      enabledInMvp: false,
    },
  });

  // ─── Product Subcategories ────────────────────────────────
  const productSubs = [
    { slug: 'electronics', name: 'Electronics', icon: 'devices' },
    { slug: 'furniture', name: 'Furniture', icon: 'chair' },
    { slug: 'vehicles', name: 'Vehicles', icon: 'directions_car' },
    { slug: 'appliances', name: 'Appliances', icon: 'kitchen' },
    { slug: 'clothing', name: 'Clothing & Accessories', icon: 'checkroom' },
    { slug: 'sports_outdoors', name: 'Sports & Outdoors', icon: 'sports' },
    { slug: 'tools_equipment', name: 'Tools & Equipment', icon: 'handyman' },
    { slug: 'other_products', name: 'Other Products', icon: 'category' },
  ];

  for (let i = 0; i < productSubs.length; i++) {
    const sub = productSubs[i];
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: {
        slug: sub.slug,
        name: sub.name,
        icon: sub.icon,
        parentCategoryId: products.id,
        sortOrder: i + 1,
        isActive: true,
        enabledInMvp: true,
      },
    });
  }

  // ─── Service Subcategories ────────────────────────────────
  const serviceSubs = [
    { slug: 'plumbing', name: 'Plumbing', icon: 'plumbing' },
    { slug: 'electrical', name: 'Electrical', icon: 'electrical_services' },
    { slug: 'hvac', name: 'HVAC', icon: 'ac_unit' },
    { slug: 'cleaning', name: 'Cleaning', icon: 'cleaning_services' },
    { slug: 'landscaping', name: 'Landscaping', icon: 'yard' },
    { slug: 'painting', name: 'Painting', icon: 'format_paint' },
    { slug: 'roofing', name: 'Roofing', icon: 'roofing' },
    { slug: 'moving', name: 'Moving & Hauling', icon: 'local_shipping' },
    { slug: 'pest_control', name: 'Pest Control', icon: 'pest_control' },
    { slug: 'handyman', name: 'Handyman', icon: 'handyman' },
    { slug: 'auto_repair', name: 'Auto Repair', icon: 'car_repair' },
    { slug: 'childcare', name: 'Childcare', icon: 'child_care' },
    { slug: 'pet_care', name: 'Pet Care', icon: 'pets' },
    { slug: 'tutoring', name: 'Tutoring & Education', icon: 'school' },
    { slug: 'personal_training', name: 'Personal Training', icon: 'fitness_center' },
    { slug: 'photography', name: 'Photography & Video', icon: 'camera_alt' },
    { slug: 'event_planning', name: 'Event Planning', icon: 'event' },
    { slug: 'other_services', name: 'Other Services', icon: 'miscellaneous_services' },
    // #383: state-licensed sub-activities split out of the broad `landscaping`
    // sub so they get gated (see seed-category-verification.ts + policy doc).
    { slug: 'landscape_irrigation', name: 'Irrigation & Sprinklers', icon: 'water_drop' },
    { slug: 'pesticide_application', name: 'Pesticide & Lawn Treatment', icon: 'grass' },
  ];

  for (let i = 0; i < serviceSubs.length; i++) {
    const sub = serviceSubs[i];
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: {
        slug: sub.slug,
        name: sub.name,
        icon: sub.icon,
        parentCategoryId: services.id,
        sortOrder: i + 1,
        isActive: true,
        enabledInMvp: true,
      },
    });
  }

  // ─── Job Subcategories ────────────────────────────────────
  const jobSubs = [
    { slug: 'entry_level', name: 'Entry Level', icon: 'school' },
    { slug: 'skilled_trade', name: 'Skilled Trade', icon: 'construction' },
    { slug: 'professional', name: 'Professional', icon: 'business_center' },
    { slug: 'management', name: 'Management', icon: 'supervisor_account' },
    { slug: 'part_time', name: 'Part Time', icon: 'schedule' },
    { slug: 'contract', name: 'Contract / Freelance', icon: 'assignment' },
    { slug: 'other_jobs', name: 'Other Jobs', icon: 'work_outline' },
  ];

  for (let i = 0; i < jobSubs.length; i++) {
    const sub = jobSubs[i];
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: {
        slug: sub.slug,
        name: sub.name,
        icon: sub.icon,
        parentCategoryId: jobs.id,
        sortOrder: i + 1,
        isActive: true,
        enabledInMvp: true,
      },
    });
  }

  // Return a complete slug -> UUID map (all top-level + subcategories) so callers
  // can resolve UUIDs for seller-profile category arrays. Querying after the
  // upserts keeps this correct regardless of which slugs exist.
  const all = await prisma.category.findMany({ select: { slug: true, id: true } });
  return Object.fromEntries(all.map((c) => [c.slug, c.id]));
}
