import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import '../utils/database.js';

// Find a school staff user to create orders for
const users = User.getAll();
const schoolUser = users.find(u => u.userType === 'school_staff') || users[0];

console.log(`Creating test orders for: ${schoolUser.contactName} (${schoolUser.schoolName})\n`);

// Test Order 1: Custom Request with STRUCTURED DATA
const customRequestData = {
  requestType: 'custom',
  projectType: 'Event Materials Package',
  projectTitle: 'Spring Open House 2025 Materials',
  timeline: '4-6 weeks',
  eventDate: '2025-04-15',
  materialTypes: [
    'Print Materials (Flyers, Brochures, etc.)',
    'Signage & Banners',
    'Digital Graphics'
  ],
  projectDescription: `We need a comprehensive set of materials for our Spring Open House event. This includes:
- Welcome banners for the entrance
- Information flyers about our programs
- Digital graphics for social media promotion
- Table tents with QR codes linking to enrollment forms`,
  objectives: 'Increase enrollment for the 2025-2026 school year, showcase our academic programs and facilities',
  targetAudience: 'Prospective families with children ages 5-14',
  keyMessages: 'Award-winning academics, small class sizes, free public charter school',
  specifications: {
    quantity: '500 flyers, 2 large banners, 50 table tents',
    sizeRequirements: 'Flyers 8.5x11, Banners 3x6 ft',
    colorPreferences: 'School colors (blue and gold)',
    existingBranding: 'Yes, have logo and brand guidelines'
  },
  files: {
    hasExistingFiles: true,
    fileDescription: 'School logo (AI and PNG), previous event photos, brand guidelines PDF',
    referenceLinks: null,
    inspirationNotes: null
  },
  budgetRange: '$1,000 - $2,500',
  additionalNotes: 'Would like to schedule a call to discuss creative direction. We\'ve had great success with similar materials in the past and want to maintain consistency.'
};

const customRequestOrder = Order.create({
  userId: schoolUser.id,
  items: [{
    productId: null,
    name: customRequestData.projectTitle,
    price: 0,
    quantity: 1,
    selectedOptions: customRequestData,
    isSpecialRequest: true,
    requestType: 'custom'
  }],
  total: 0,
  shippingInfo: {
    schoolName: schoolUser.schoolName,
    contactName: schoolUser.contactName,
    positionTitle: schoolUser.positionTitle || 'Marketing Coordinator',
    principalName: schoolUser.principalName || 'Dr. Smith',
    email: schoolUser.email,
    phone: schoolUser.phone || '305-555-1234',
  },
  notes: customRequestData.additionalNotes
});

console.log(`✅ Created Custom Request Order:`);
console.log(`   Order #: ${customRequestOrder.orderNumber}`);
console.log(`   ID: ${customRequestOrder.id}`);
console.log(`   Status: ${customRequestOrder.status}\n`);

// Test Order 2: Meta Ads Campaign with STRUCTURED DATA
const metaAdsData = {
  requestType: 'meta-ads',
  campaignObjective: 'Student Enrollment',
  otherObjective: null,
  campaignName: 'Fall 2025 Enrollment Campaign',
  targetAudience: {
    demographics: [
      'Parents of elementary-age children (5-10)',
      'Parents of middle school-age children (11-13)'
    ],
    geographicArea: 'Miami-Dade County, focusing on Kendall and Doral areas',
    radiusMiles: '15',
    additionalTargeting: 'Household income $50K+, interested in education and parenting'
  },
  budgetTimeline: {
    monthlyBudget: '$2,000 - $3,500/month',
    duration: '3 months',
    startDate: '2025-02-01'
  },
  creative: {
    hasCreativeAssets: 'yes-needs-adaptation',
    creativeDescription: 'Campus photos, student testimonial videos from last year, school logo',
    keyMessages: 'Free public charter school, A-rated academics, small class sizes, now enrolling K-8',
    callToAction: 'Schedule a Tour'
  },
  landingPage: {
    hasLandingPage: 'yes',
    landingPageUrl: 'https://www.exampleschool.org/enroll',
    needsLandingPage: false
  },
  metaPresence: {
    hasFacebookPage: 'yes',
    facebookPageUrl: 'https://www.facebook.com/exampleschool',
    hasInstagramAccount: 'yes',
    instagramHandle: 'exampleschool',
    hasMetaAdsAccount: 'yes'
  },
  additionalInfo: {
    previousAdExperience: 'Ran a small campaign last year with moderate success. Got about 50 tour sign-ups over 2 months with a $1,500 budget. Want to scale up this year.',
    competitorSchools: 'ABC Academy, XYZ Charter, Sunshine Prep'
  },
  additionalNotes: 'We\'re looking to significantly increase enrollment this year. Our school has capacity for 50 more students and we want to fill those spots by August. Open to recommendations on creative strategy and budget allocation.'
};

const metaAdsOrder = Order.create({
  userId: schoolUser.id,
  items: [{
    productId: null,
    name: metaAdsData.campaignName,
    price: 0,
    quantity: 1,
    selectedOptions: metaAdsData,
    isSpecialRequest: true,
    requestType: 'meta-ads'
  }],
  total: 0,
  shippingInfo: {
    schoolName: schoolUser.schoolName,
    contactName: schoolUser.contactName,
    positionTitle: schoolUser.positionTitle || 'Marketing Coordinator',
    principalName: schoolUser.principalName || 'Dr. Smith',
    email: schoolUser.email,
    phone: schoolUser.phone || '305-555-1234',
  },
  notes: metaAdsData.additionalNotes
});

console.log(`✅ Created Meta Ads Campaign Order:`);
console.log(`   Order #: ${metaAdsOrder.orderNumber}`);
console.log(`   ID: ${metaAdsOrder.id}`);
console.log(`   Status: ${metaAdsOrder.status}\n`);

console.log('========================================');
console.log('Test orders created with STRUCTURED DATA!');
console.log('View them in Admin > Manage Orders to see the formatted display.');
