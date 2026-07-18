import { PrismaClient, AccountType, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
    console.log('Seeding database...');
    // ─── Categories ───────────────────────────────────────────
    // Top-level (MVP-enabled)
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
    // ─── Test Users ───────────────────────────────────────────
    const passwordHash = await bcrypt.hash('TestPassword123!', 12);
    const testBuyer = await prisma.user.upsert({
        where: { email: 'buyer@test.com' },
        update: {},
        create: {
            email: 'buyer@test.com',
            passwordHash,
            accountType: AccountType.buyer,
            firstName: 'Test',
            lastName: 'Buyer',
            phone: '+12145551001',
            emailVerified: true,
            locationCity: 'Dallas',
            locationState: 'TX',
            locationZip: '75201',
            latitude: 32.7767,
            longitude: -96.797,
            status: UserStatus.active,
        },
    });
    const testSeller = await prisma.user.upsert({
        where: { email: 'seller@test.com' },
        update: {},
        create: {
            email: 'seller@test.com',
            passwordHash,
            accountType: AccountType.seller,
            firstName: 'Test',
            lastName: 'Seller',
            phone: '+12145551002',
            emailVerified: true,
            locationCity: 'Fort Worth',
            locationState: 'TX',
            locationZip: '76102',
            latitude: 32.7555,
            longitude: -97.3308,
            status: UserStatus.active,
        },
    });
    // Create seller profile for test seller
    await prisma.sellerProfile.upsert({
        where: { userId: testSeller.id },
        update: {},
        create: {
            userId: testSeller.id,
            businessName: 'Test Seller Services',
            serviceRadiusMiles: 30,
            categories: JSON.stringify(['services']),
            subcategories: JSON.stringify(['plumbing', 'handyman']),
            bio: 'Experienced handyman and plumber serving the DFW area.',
            yearsExperience: 10,
            verificationTier: 1,
            emailVerified: true,
            profileStrength: 60,
        },
    });
    const testBoth = await prisma.user.upsert({
        where: { email: 'both@test.com' },
        update: {},
        create: {
            email: 'both@test.com',
            passwordHash,
            accountType: AccountType.both,
            firstName: 'Test',
            lastName: 'BothRoles',
            phone: '+12145551003',
            emailVerified: true,
            locationCity: 'Arlington',
            locationState: 'TX',
            locationZip: '76010',
            latitude: 32.7357,
            longitude: -97.1081,
            status: UserStatus.active,
        },
    });
    await prisma.sellerProfile.upsert({
        where: { userId: testBoth.id },
        update: {},
        create: {
            userId: testBoth.id,
            businessName: 'Multi-Role Services',
            serviceRadiusMiles: 25,
            categories: JSON.stringify(['products', 'services']),
            subcategories: JSON.stringify(['electronics', 'cleaning']),
            bio: 'Buyer and seller in the DFW marketplace.',
            yearsExperience: 5,
            verificationTier: 1,
            emailVerified: true,
            profileStrength: 45,
        },
    });
    // Admin user
    await prisma.user.upsert({
        where: { email: 'admin@reversemarketplace.com' },
        update: {},
        create: {
            email: 'admin@reversemarketplace.com',
            passwordHash: await bcrypt.hash('AdminSecure456!', 12),
            accountType: AccountType.both,
            firstName: 'Platform',
            lastName: 'Admin',
            emailVerified: true,
            locationCity: 'Dallas',
            locationState: 'TX',
            locationZip: '75201',
            status: UserStatus.active,
        },
    });
    console.log('Seed completed successfully!');
    console.log(`  - 5 top-level categories`);
    console.log(`  - ${productSubs.length} product subcategories`);
    console.log(`  - ${serviceSubs.length} service subcategories`);
    console.log(`  - ${jobSubs.length} job subcategories`);
    console.log(`  - 4 test users (buyer, seller, both, admin)`);
}
main()
    .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map