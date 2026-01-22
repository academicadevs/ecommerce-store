import { Product } from '../models/Product.js';
import '../utils/database.js';

const newProducts = [
  // ===== DIRECT MAIL =====
  {
    name: 'EDDM Direct Mailers',
    description: 'Every Door Direct Mail postcards perfect for student enrollment campaigns. Reach every household in targeted neighborhoods without needing a mailing list. USPS-compliant sizes and postage-saving formats.',
    priceMin: 149.99,
    priceMax: 1499.99,
    category: 'Marketing Materials',
    subcategory: 'Direct Mail',
    imageUrl: 'https://images.unsplash.com/photo-1579275542618-a1dfed5f54ba?w=600',
    options: {
      size: {
        label: 'Size',
        values: ['6.5" x 9"', '6.5" x 12"', '8.5" x 11"', '9" x 12"'],
        default: '6.5" x 9"'
      },
      paperType: {
        label: 'Paper Type',
        values: ['14pt Cardstock Gloss', '14pt Cardstock Matte', '16pt Cardstock Gloss'],
        default: '14pt Cardstock Gloss'
      },
      coating: {
        label: 'Coating',
        values: ['UV Gloss (Front)', 'UV Matte (Front)', 'AQ Gloss (Both Sides)', 'No Coating'],
        default: 'UV Gloss (Front)'
      },
      quantity: {
        label: 'Quantity',
        values: ['500', '1000', '2500', '5000', '10000', '25000'],
        default: '2500'
      },
      turnaround: {
        label: 'Printing Time',
        values: ['5 Business Days', '7 Business Days', '10 Business Days'],
        default: '7 Business Days'
      }
    },
    features: [
      'USPS EDDM-compliant sizes',
      'No mailing list required - reach every address',
      'Target specific zip codes and carrier routes',
      'Full-color printing front and back',
      'Postage savings vs. standard mail',
      'Perfect for enrollment season campaigns'
    ]
  },
  {
    name: 'Targeted Direct Mail Postcards',
    description: 'Premium direct mail postcards for targeted mailing lists. Ideal for reaching prospective families, re-enrollment campaigns, and event invitations. Includes variable data printing for personalization.',
    priceMin: 99.99,
    priceMax: 899.99,
    category: 'Marketing Materials',
    subcategory: 'Direct Mail',
    imageUrl: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=600',
    options: {
      size: {
        label: 'Size',
        values: ['4" x 6"', '5" x 7"', '6" x 9"', '6" x 11"'],
        default: '6" x 9"'
      },
      paperType: {
        label: 'Paper Type',
        values: ['14pt Cardstock Gloss', '14pt Cardstock Matte', '16pt Cardstock', '16pt Silk'],
        default: '14pt Cardstock Gloss'
      },
      personalization: {
        label: 'Personalization',
        values: ['None', 'Name Only', 'Name + Address', 'Full Variable Data'],
        default: 'None'
      },
      quantity: {
        label: 'Quantity',
        values: ['250', '500', '1000', '2500', '5000'],
        default: '1000'
      },
      turnaround: {
        label: 'Printing Time',
        values: ['5 Business Days', '7 Business Days'],
        default: '7 Business Days'
      }
    },
    features: [
      'Variable data printing for personalization',
      'Addresses printed directly on piece',
      'USPS mailing compliant',
      'Full-color both sides',
      'Perfect for targeted enrollment outreach',
      'Mailing services available'
    ]
  },

  // ===== DIGITAL PRODUCTS =====
  {
    name: 'Branded Presentation Templates',
    description: 'Professional, fully-editable presentation templates customized with your school branding. Perfect for Back-to-School Night, curriculum presentations, staff meetings, and board presentations. Available for PowerPoint, Google Slides, and Canva.',
    priceMin: 99.99,
    priceMax: 299.99,
    category: 'Digital Products',
    subcategory: 'Presentation Templates',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600',
    options: {
      platform: {
        label: 'Platform',
        values: ['PowerPoint', 'Google Slides', 'Canva', 'All Platforms'],
        default: 'All Platforms'
      },
      slideCount: {
        label: 'Slide Templates',
        values: ['10 Slides', '20 Slides', '30 Slides', '50 Slides'],
        default: '20 Slides'
      },
      style: {
        label: 'Design Style',
        values: ['Modern & Clean', 'Bold & Vibrant', 'Classic & Professional', 'Fun & Playful'],
        default: 'Modern & Clean'
      },
      turnaround: {
        label: 'Delivery Time',
        values: ['3 Business Days', '5 Business Days', '7 Business Days'],
        default: '5 Business Days'
      }
    },
    features: [
      'Fully customized with your school colors and logo',
      'Editable text, images, and layouts',
      'Multiple slide layouts included',
      'Compatible with PowerPoint, Google Slides, and Canva',
      'Includes title, content, image, and chart slides',
      'Unlimited future use for your school'
    ]
  },
  {
    name: 'Social Media Graphics Package',
    description: 'Eye-catching social media templates branded for your school. Includes templates for announcements, events, achievements, spirit days, and more. Sized for Instagram, Facebook, and Twitter.',
    priceMin: 79.99,
    priceMax: 349.99,
    category: 'Digital Products',
    subcategory: 'Social Media Templates',
    imageUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600',
    options: {
      package: {
        label: 'Package Size',
        values: ['Starter (10 templates)', 'Standard (25 templates)', 'Premium (50 templates)', 'Complete (100 templates)'],
        default: 'Standard (25 templates)'
      },
      platforms: {
        label: 'Social Platforms',
        values: ['Instagram Only', 'Facebook Only', 'Instagram + Facebook', 'All Platforms (IG, FB, Twitter)'],
        default: 'Instagram + Facebook'
      },
      editFormat: {
        label: 'Edit Format',
        values: ['Canva', 'Adobe Photoshop', 'Both'],
        default: 'Canva'
      },
      turnaround: {
        label: 'Delivery Time',
        values: ['3 Business Days', '5 Business Days', '7 Business Days'],
        default: '5 Business Days'
      }
    },
    features: [
      'Branded with your school colors, logo, and fonts',
      'Templates for events, announcements, and achievements',
      'Spirit week and holiday templates included',
      'Optimized sizes for each social platform',
      'Easy editing in Canva - no design skills needed',
      'Includes posting guide and best practices'
    ]
  },
  {
    name: 'Editable Document Templates',
    description: 'Professional branded templates for everyday school communications. Includes newsletter templates, flyer templates, letterhead, parent letters, and more. Edit in Canva, Word, or Google Docs.',
    priceMin: 69.99,
    priceMax: 249.99,
    category: 'Digital Products',
    subcategory: 'Document Templates',
    imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600',
    options: {
      package: {
        label: 'Template Package',
        values: ['Essentials (10 templates)', 'Standard (20 templates)', 'Complete (40 templates)'],
        default: 'Standard (20 templates)'
      },
      templateTypes: {
        label: 'Focus Area',
        values: ['General Communications', 'Events & Activities', 'Administrative', 'All Types'],
        default: 'All Types'
      },
      editFormat: {
        label: 'Edit Format',
        values: ['Canva', 'Microsoft Word', 'Google Docs', 'All Formats'],
        default: 'All Formats'
      },
      turnaround: {
        label: 'Delivery Time',
        values: ['3 Business Days', '5 Business Days', '7 Business Days'],
        default: '5 Business Days'
      }
    },
    features: [
      'Newsletter templates (weekly, monthly)',
      'Event flyer templates',
      'Parent letter templates',
      'Permission slip templates',
      'Branded with your school identity',
      'Print-ready and digital-friendly formats'
    ]
  },
  {
    name: 'Digital Signage Templates',
    description: 'Dynamic templates for your school TVs and digital displays. Perfect for lobby monitors, cafeteria displays, and hallway screens. Includes announcement slides, event countdowns, menu boards, and celebration displays.',
    priceMin: 89.99,
    priceMax: 279.99,
    category: 'Digital Products',
    subcategory: 'Digital Signage',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600',
    options: {
      package: {
        label: 'Template Package',
        values: ['Starter (15 slides)', 'Standard (30 slides)', 'Premium (50 slides)'],
        default: 'Standard (30 slides)'
      },
      displayType: {
        label: 'Display Orientation',
        values: ['Landscape (16:9)', 'Portrait (9:16)', 'Both Orientations'],
        default: 'Landscape (16:9)'
      },
      contentTypes: {
        label: 'Content Focus',
        values: ['Daily Announcements', 'Events & Celebrations', 'Cafeteria/Menu', 'Mixed Content'],
        default: 'Mixed Content'
      },
      turnaround: {
        label: 'Delivery Time',
        values: ['3 Business Days', '5 Business Days', '7 Business Days'],
        default: '5 Business Days'
      }
    },
    features: [
      'Sized for standard TV displays (1920x1080)',
      'Daily announcement templates',
      'Event countdown displays',
      'Cafeteria menu board templates',
      'Achievement and celebration slides',
      'Easy to update in PowerPoint or Google Slides',
      'Animated options available'
    ]
  }
];

async function addProducts() {
  console.log('Adding new products...\n');

  let added = 0;
  let skipped = 0;

  for (const productData of newProducts) {
    // Check if product already exists by name
    const existing = Product.getAll().find(p => p.name === productData.name);
    if (existing) {
      console.log(`⏭️  Skipped (already exists): ${productData.name}`);
      skipped++;
      continue;
    }

    try {
      const product = Product.create(productData);
      console.log(`✅ Added: ${product.name} (${product.category} > ${product.subcategory})`);
      added++;
    } catch (error) {
      console.error(`❌ Failed to add ${productData.name}:`, error.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`Added: ${added} products`);
  console.log(`Skipped: ${skipped} products`);
  console.log(`Total products now: ${Product.count()}`);
}

addProducts();
