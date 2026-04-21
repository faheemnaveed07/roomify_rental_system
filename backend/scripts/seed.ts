/**
 * Roomify — Demo Data Seed Script
 *
 * Run:
 *   npx ts-node -r tsconfig-paths/register scripts/seed.ts
 *   npx ts-node -r tsconfig-paths/register scripts/seed.ts --clear   (wipe existing data first)
 *
 * Creates:
 *   - 12 landlords  (email: landlord1@demo.com … password: Demo@1234)
 *   - 2  tenants    (tenant1@demo.com, tenant2@demo.com  … password: Demo@1234)
 *   - 2-3 properties per landlord (mix of shared_room / full_house, ACTIVE status)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/models/User';
import Property from '../src/models/Property';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── helpers ────────────────────────────────────────────────────────────────

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickMany = <T>(arr: T[], min: number, max: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    const count = min + Math.floor(Math.random() * (max - min + 1));
    return shuffled.slice(0, count);
};
const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Pakistani data pools ────────────────────────────────────────────────────

const firstNamesM = ['Ali', 'Ahmed', 'Usman', 'Hassan', 'Bilal', 'Imran', 'Farhan', 'Zaid', 'Omer', 'Kamran', 'Shahid', 'Tariq'];
const firstNamesF = ['Ayesha', 'Fatima', 'Sana', 'Nadia', 'Zainab', 'Mariam', 'Hira', 'Sara'];
const lastNames = ['Khan', 'Malik', 'Qureshi', 'Chaudhry', 'Siddiqui', 'Ahmed', 'Ali', 'Butt', 'Sheikh', 'Ansari', 'Rizvi', 'Mirza'];

const cities: { city: string; coords: [number, number]; areas: string[] }[] = [
    {
        city: 'Lahore',
        coords: [74.3587, 31.5204],
        areas: ['DHA Phase 5', 'Gulberg III', 'Model Town', 'Bahria Town', 'Johar Town', 'Garden Town', 'Faisal Town', 'Wapda Town'],
    },
    {
        city: 'Karachi',
        coords: [67.0099, 24.8607],
        areas: ['DHA Phase 6', 'Clifton', 'Gulshan-e-Iqbal', 'PECHS', 'North Nazimabad', 'Gulistan-e-Jauhar', 'Bahria Town'],
    },
    {
        city: 'Islamabad',
        coords: [73.0479, 33.6844],
        areas: ['F-6', 'F-7', 'F-8', 'G-9', 'G-10', 'E-11', 'DHA Islamabad', 'Bahria Enclave'],
    },
    {
        city: 'Multan',
        coords: [71.4753, 30.1984],
        areas: ['Gulgasht Colony', 'Cantt', 'Shah Rukn-e-Alam', 'Bosan Road', 'New Multan'],
    },
    {
        city: 'Rawalpindi',
        coords: [73.0651, 33.5651],
        areas: ['Saddar', 'Bahria Town Phase 8', 'Gulraiz Housing', 'Askari 14', 'Chaklala Scheme'],
    },
];

const streetNames = ['Street', 'Block', 'Avenue', 'Lane', 'Road', 'Close'];

const AMENITIES_POOL = [
    'wifi', 'ac', 'heating', 'parking', 'laundry', 'security',
    'cctv', 'generator', 'water_tank', 'balcony', 'cable_tv',
    'elevator', 'garden', 'intercom',
];

// Premium listings always get these base amenities, then extras on top
const PREMIUM_AMENITIES_BASE = [
    'wifi', 'ac', 'heating', 'parking', 'security', 'cctv',
    'generator', 'water_tank', 'elevator', 'intercom',
];
const PREMIUM_AMENITIES_EXTRAS = ['laundry', 'gym', 'pool', 'balcony', 'garden', 'rooftop', 'servant_quarter'];

const ADDITIONAL_RULES = [
    'No loud music after 10 PM',
    'No watercooler damage',
    'Monthly rent due by 5th',
    'No subletting allowed',
    'Guests must leave before midnight',
];

// ─── property templates ──────────────────────────────────────────────────────

type PropertyTemplate = {
    titleFn: (area: string, city: string) => string;
    descFn: (area: string) => string;
    type: 'shared_room' | 'full_house';
    rentRange: [number, number];
    depositMultiplier: number;
    sizeRange: [number, number];
    sizeUnit: 'sqft' | 'sqm' | 'marla' | 'kanal';
    sharedRoom?: () => { totalBeds: number; availableBeds: number; genderPreference: string };
    fullHouse?: () => { bedrooms: number; bathrooms: number; floors: number; parkingSpaces: number; furnishingStatus: string };
};

const templates: PropertyTemplate[] = [
    // ── BUDGET: Basic room, very affordable ──────────────────────────────────
    {
        titleFn: (_area, city) => `Basic Room for Rent in ${city}`,
        descFn: (area) =>
            `Simple, affordable room in ${area}. Shared bathroom. Suitable for students or those on a tight budget. Close to public transport.`,
        type: 'shared_room',
        rentRange: [5000, 8000],
        depositMultiplier: 1,
        sizeRange: [60, 100],
        sizeUnit: 'sqft',
        sharedRoom: () => ({
            totalBeds: randInt(4, 8),
            availableBeds: randInt(1, 3),
            genderPreference: pick(['male', 'female']),
        }),
    },

    // ── MID: Furnished shared room in a residential building ─────────────────
    {
        titleFn: (area, city) => `Furnished Room Available in ${area}, ${city}`,
        descFn: (area) =>
            `Well-maintained furnished room in a shared apartment in ${area}. All utilities included. Ideal for working professionals. CCTV-secured building with 24/7 guard.`,
        type: 'shared_room',
        rentRange: [10000, 18000],
        depositMultiplier: 2,
        sizeRange: [120, 200],
        sizeUnit: 'sqft',
        sharedRoom: () => ({
            totalBeds: randInt(3, 5),
            availableBeds: randInt(1, 2),
            genderPreference: pick(['male', 'female', 'any']),
        }),
    },

    // ── MID: Spacious 1-bed apartment ────────────────────────────────────────
    {
        titleFn: (area, _city) => `Spacious 1-Bed Apartment in ${area}`,
        descFn: (area) =>
            `Bright 1-bedroom apartment in ${area} with attached bath and a modern kitchen. Semi-furnished. Quiet street, close to markets and public transport.`,
        type: 'full_house',
        rentRange: [25000, 42000],
        depositMultiplier: 2,
        sizeRange: [550, 850],
        sizeUnit: 'sqft',
        fullHouse: () => ({
            bedrooms: 1,
            bathrooms: 1,
            floors: 1,
            parkingSpaces: pick([0, 1]),
            furnishingStatus: 'semi-furnished',
        }),
    },

    // ── MID: 2-bed fully furnished flat ──────────────────────────────────────
    {
        titleFn: (area, _city) => `Fully Furnished 2-Bed Flat in ${area}`,
        descFn: (area) =>
            `Move-in ready 2-bedroom flat in ${area}. Split ACs, refrigerator, and double beds included. Generator backup and rooftop access available. Perfect for small families or couples.`,
        type: 'full_house',
        rentRange: [45000, 72000],
        depositMultiplier: 2,
        sizeRange: [900, 1300],
        sizeUnit: 'sqft',
        fullHouse: () => ({
            bedrooms: 2,
            bathrooms: 2,
            floors: 1,
            parkingSpaces: 1,
            furnishingStatus: 'furnished',
        }),
    },

    // ── MID-HIGH: Independent 3-bed house ────────────────────────────────────
    {
        titleFn: (area, city) => `3-Bed Independent House in ${area}, ${city}`,
        descFn: (area) =>
            `Spacious 3-bedroom house in ${area} with a front lawn and covered parking for 2 cars. Semi-furnished with modular kitchen. 24/7 water supply, UPS, and security cameras installed.`,
        type: 'full_house',
        rentRange: [65000, 110000],
        depositMultiplier: 3,
        sizeRange: [7, 10],
        sizeUnit: 'marla',
        fullHouse: () => ({
            bedrooms: 3,
            bathrooms: 3,
            floors: 2,
            parkingSpaces: 2,
            furnishingStatus: 'semi-furnished',
        }),
    },

    // ── PREMIUM: Luxury apartment ─────────────────────────────────────────────
    {
        titleFn: (area, city) => `Luxury 3-Bed Apartment in ${area}, ${city}`,
        descFn: (area) =>
            `Premium fully furnished apartment in the heart of ${area}. Features imported fittings, dedicated covered parking, 24/7 security guards, CCTV, and a rooftop terrace. Perfect for executives and families who want the best.`,
        type: 'full_house',
        rentRange: [130000, 175000],
        depositMultiplier: 3,
        sizeRange: [1800, 2600],
        sizeUnit: 'sqft',
        fullHouse: () => ({
            bedrooms: 3,
            bathrooms: 3,
            floors: 1,
            parkingSpaces: 2,
            furnishingStatus: 'furnished',
        }),
    },

    // ── PREMIUM: High-end villa ───────────────────────────────────────────────
    {
        titleFn: (area, city) => `Premium 5-Bed Villa in ${area}, ${city}`,
        descFn: (area) =>
            `Stunning 5-bedroom villa in an elite gated community in ${area}. Includes a private garden, heated pool, home theater, servant quarter, and smart home automation. Ideal for large families seeking a luxury lifestyle.`,
        type: 'full_house',
        rentRange: [180000, 250000],
        depositMultiplier: 3,
        sizeRange: [1, 2],
        sizeUnit: 'kanal',
        fullHouse: () => ({
            bedrooms: 5,
            bathrooms: 5,
            floors: 2,
            parkingSpaces: 4,
            furnishingStatus: 'furnished',
        }),
    },
];

// Placeholder images rotated from picsum for variety
const imageUrls = [
    [
        { url: 'https://picsum.photos/seed/room1/800/600', publicId: 'seed_room1', isPrimary: true },
        { url: 'https://picsum.photos/seed/room1b/800/600', publicId: 'seed_room1b', isPrimary: false },
    ],
    [
        { url: 'https://picsum.photos/seed/apt2/800/600', publicId: 'seed_apt2', isPrimary: true },
        { url: 'https://picsum.photos/seed/apt2b/800/600', publicId: 'seed_apt2b', isPrimary: false },
    ],
    [
        { url: 'https://picsum.photos/seed/house3/800/600', publicId: 'seed_house3', isPrimary: true },
        { url: 'https://picsum.photos/seed/house3b/800/600', publicId: 'seed_house3b', isPrimary: false },
    ],
    [
        { url: 'https://picsum.photos/seed/flat4/800/600', publicId: 'seed_flat4', isPrimary: true },
        { url: 'https://picsum.photos/seed/flat4b/800/600', publicId: 'seed_flat4b', isPrimary: false },
    ],
    [
        { url: 'https://picsum.photos/seed/villa5/800/600', publicId: 'seed_villa5', isPrimary: true },
        { url: 'https://picsum.photos/seed/villa5b/800/600', publicId: 'seed_villa5b', isPrimary: false },
    ],
];

// ─── seed data definitions ───────────────────────────────────────────────────

const LANDLORD_COUNT = 12;
const DEMO_PASSWORD = 'Demo@1234';

// Tenant demo accounts
const TENANTS = [
    { firstName: 'Hamza', lastName: 'Siddiqui', email: 'tenant1@demo.com', phone: '03001234567' },
    { firstName: 'Saima', lastName: 'Noor', email: 'tenant2@demo.com', phone: '03111234567' },
];

// ─── main ────────────────────────────────────────────────────────────────────

async function seed() {
    const mongoUri =
        process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roomify';

    await mongoose.connect(mongoUri.replace(/\blocalhost\b/, '127.0.0.1'));
    console.log('✅ Connected to MongoDB:', mongoUri);

    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
        await User.deleteMany({ email: /demo\.com$/ });
        await Property.deleteMany({ 'images.publicId': /^seed_/ });
        console.log('🗑  Cleared existing seed data');
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    // ── Create tenants ──────────────────────────────────────────────────────
    const tenantDocs = [];
    for (const t of TENANTS) {
        const existing = await User.findOne({ email: t.email });
        if (existing) {
            console.log(`  ⏩ Tenant already exists: ${t.email}`);
            tenantDocs.push(existing);
            continue;
        }
        const tenant = await User.create({
            ...t,
            password: passwordHash,
            role: 'tenant',
            status: 'active',
            emailVerified: true,
            cnicNumber: `${randInt(10000, 99999)}-${randInt(1000000, 9999999)}-${randInt(1, 9)}`,
        });
        tenantDocs.push(tenant);
        console.log(`  👤 Tenant created: ${tenant.email}`);
    }

    // ── Create landlords ────────────────────────────────────────────────────
    let propertiesCreated = 0;

    for (let i = 1; i <= LANDLORD_COUNT; i++) {
        const isFemale = i % 5 === 0; // every 5th landlord is female
        const firstName = pick(isFemale ? firstNamesF : firstNamesM);
        const lastName = pick(lastNames);
        const email = `landlord${i}@demo.com`;

        let landlord = await User.findOne({ email });
        if (!landlord) {
            const phonePrefixes = ['0300', '0311', '0321', '0331', '0341', '0351'];
            landlord = await User.create({
                email,
                password: passwordHash,
                firstName,
                lastName,
                phone: `${pick(phonePrefixes)}${randInt(1000000, 9999999)}`,
                role: 'landlord',
                status: 'active',
                emailVerified: true,
                cnicNumber: `${randInt(10000, 99999)}-${randInt(1000000, 9999999)}-${randInt(1, 9)}`,
            });
            console.log(`  🏠 Landlord created: ${email} (${firstName} ${lastName})`);
        } else {
            console.log(`  ⏩ Landlord already exists: ${email}`);
        }

        // ── Create 2-3 properties for this landlord ─────────────────────
        const propCount = randInt(2, 3);
        const usedTemplates = new Set<number>();

        for (let p = 0; p < propCount; p++) {
            // Pick a template we haven't used for this landlord yet
            let tIdx: number;
            do { tIdx = randInt(0, templates.length - 1); } while (usedTemplates.has(tIdx));
            usedTemplates.add(tIdx);
            const tmpl = templates[tIdx];

            const cityData = pick(cities);
            const area = pick(cityData.areas);
            const streetNum = randInt(1, 50);
            const address = `House ${streetNum}, ${randInt(1, 15)}-${pick(streetNames)}, ${area}`;

            // Small coordinate jitter so properties don't overlap on a map
            const jitter = () => (Math.random() - 0.5) * 0.05;
            const coords: [number, number] = [
                cityData.coords[0] + jitter(),
                cityData.coords[1] + jitter(),
            ];

            const rent = randInt(tmpl.rentRange[0], tmpl.rentRange[1]);
            // Round to nearest 500
            const roundedRent = Math.round(rent / 500) * 500;
            const deposit = roundedRent * tmpl.depositMultiplier;

            const isPremium = roundedRent >= 120000;
            const amenities = isPremium
                ? [...PREMIUM_AMENITIES_BASE, ...pickMany(PREMIUM_AMENITIES_EXTRAS, 3, 5)]
                : pickMany(AMENITIES_POOL, 4, 8);

            const propertyData: Record<string, unknown> = {
                owner: landlord._id,
                title: tmpl.titleFn(area, cityData.city),
                description: tmpl.descFn(area),
                propertyType: tmpl.type,
                status: 'active',
                location: {
                    type: 'Point',
                    coordinates: coords,
                    address,
                    city: cityData.city,
                    area,
                    postalCode: `${randInt(10000, 99999)}`,
                },
                rent: {
                    amount: roundedRent,
                    currency: 'PKR',
                    paymentFrequency: 'monthly',
                    securityDeposit: deposit,
                },
                size: {
                    value: randInt(tmpl.sizeRange[0], tmpl.sizeRange[1]),
                    unit: tmpl.sizeUnit,
                },
                images: imageUrls[p % imageUrls.length],
                amenities,
                rules: {
                    petsAllowed: Math.random() > 0.7,
                    smokingAllowed: Math.random() > 0.8,
                    visitorsAllowed: true,
                    additionalRules: pickMany(ADDITIONAL_RULES, 1, 2),
                },
                availability: {
                    isAvailable: true,
                    availableFrom: new Date(),
                    minimumStay: pick([1, 3, 6]),
                },
            };

            if (tmpl.type === 'shared_room' && tmpl.sharedRoom) {
                propertyData.sharedRoomDetails = tmpl.sharedRoom();
            }
            if (tmpl.type === 'full_house' && tmpl.fullHouse) {
                propertyData.fullHouseDetails = tmpl.fullHouse();
            }

            await Property.create(propertyData);
            propertiesCreated++;
            console.log(`    🏘  Property added: "${propertyData.title}" — PKR ${roundedRent.toLocaleString()}/mo`);
        }
    }

    console.log('\n─────────────────────────────────────────────');
    console.log(`✅ Seed complete!`);
    console.log(`   Landlords : ${LANDLORD_COUNT}`);
    console.log(`   Tenants   : ${TENANTS.length}`);
    console.log(`   Properties: ${propertiesCreated}`);
    console.log('\n Demo login credentials (password for all: Demo@1234)');
    console.log('   tenant1@demo.com — tenant2@demo.com');
    console.log('   landlord1@demo.com … landlord12@demo.com');
    console.log('─────────────────────────────────────────────\n');

    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
