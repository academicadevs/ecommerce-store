import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Product = {
  create: ({ name, description, priceMin, priceMax, category, subcategory, imageUrl, images, options, features, inStock = true }) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Get the max sortOrder and add 1 for new products
    const maxOrderResult = db.prepare('SELECT MAX(sortOrder) as maxOrder FROM products').get();
    const sortOrder = (maxOrderResult.maxOrder || 0) + 1;

    const stmt = db.prepare(`
      INSERT INTO products (id, name, description, priceMin, priceMax, category, subcategory, imageUrl, images, options, features, inStock, sortOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, name, description, priceMin, priceMax, category, subcategory || null,
      imageUrl || null, images ? JSON.stringify(images) : null,
      options ? JSON.stringify(options) : null,
      features ? JSON.stringify(features) : null,
      inStock ? 1 : 0, sortOrder, now, now
    );

    return { id, name, description, priceMin, priceMax, category, subcategory, imageUrl, images, options, features, inStock, sortOrder, createdAt: now, updatedAt: now };
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const product = stmt.get(id);
    if (product) {
      product.inStock = Boolean(product.inStock);
      product.images = product.images ? JSON.parse(product.images) : [];
      product.options = product.options ? JSON.parse(product.options) : null;
      product.features = product.features ? JSON.parse(product.features) : [];
      product.overview = product.overview ? JSON.parse(product.overview) : null;
      product.sortOrder = product.sortOrder || 0;
    }
    return product;
  },

  getAll: ({ category, subcategory, search, inStock } = {}) => {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (subcategory) {
      query += ' AND subcategory = ?';
      params.push(subcategory);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (inStock !== undefined) {
      query += ' AND inStock = ?';
      params.push(inStock ? 1 : 0);
    }

    query += ' ORDER BY sortOrder ASC, name ASC';

    const stmt = db.prepare(query);
    const products = stmt.all(...params);

    return products.map(p => ({
      ...p,
      inStock: Boolean(p.inStock),
      images: p.images ? JSON.parse(p.images) : [],
      options: p.options ? JSON.parse(p.options) : null,
      features: p.features ? JSON.parse(p.features) : [],
      overview: p.overview ? JSON.parse(p.overview) : null,
      sortOrder: p.sortOrder || 0
    }));
  },

  update: (id, { name, description, priceMin, priceMax, category, subcategory, imageUrl, images, options, features, inStock }) => {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE products
      SET name = ?, description = ?, priceMin = ?, priceMax = ?, category = ?, subcategory = ?,
          imageUrl = ?, images = ?, options = ?, features = ?, inStock = ?, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      name, description, priceMin, priceMax, category, subcategory || null,
      imageUrl || null, images ? JSON.stringify(images) : null,
      options ? JSON.stringify(options) : null,
      features ? JSON.stringify(features) : null,
      inStock ? 1 : 0, now, id
    );

    return Product.findById(id);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
  },

  // Reorder products - accepts an array of product IDs in the desired order
  reorder: (productIds) => {
    const updateStmt = db.prepare('UPDATE products SET sortOrder = ?, updatedAt = ? WHERE id = ?');
    const now = new Date().toISOString();

    const transaction = db.transaction(() => {
      productIds.forEach((id, index) => {
        updateStmt.run(index + 1, now, id);
      });
    });

    transaction();
    return true;
  },

  getCategories: () => {
    const stmt = db.prepare('SELECT DISTINCT category FROM products ORDER BY category');
    return stmt.all().map(row => row.category);
  },

  getSubcategories: (category) => {
    const stmt = db.prepare('SELECT DISTINCT subcategory FROM products WHERE category = ? AND subcategory IS NOT NULL ORDER BY subcategory');
    return stmt.all(category).map(row => row.subcategory);
  },

  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM products');
    return stmt.get().count;
  },

  seedProducts: () => {
    const existingCount = Product.count();
    if (existingCount > 0) return;

    const sampleProducts = [
      // ===== MARKETING MATERIALS =====
      // Flyers
      {
        name: 'Business Flyers',
        description: 'High-quality full-color flyers perfect for open houses, enrollment events, and promotional campaigns. Available in multiple sizes and paper options.',
        priceMin: 29.99,
        priceMax: 299.99,
        category: 'Marketing Materials',
        subcategory: 'Flyers',
        imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600',
        options: {
          size: {
            label: 'Size (before folding)',
            values: ['8.5" x 11"', '5.5" x 8.5"', '4" x 6"', '6" x 9"'],
            default: '8.5" x 11"'
          },
          paperType: {
            label: 'Paper Type',
            values: ['100 lb. Paper Gloss', '100 lb. Paper Matte', '80 lb. Uncoated', '14pt Cardstock'],
            default: '100 lb. Paper Gloss'
          },
          printedSide: {
            label: 'Printed Side',
            values: ['Front Only', 'Front & Back'],
            default: 'Front Only'
          },
          quantity: {
            label: 'Quantity',
            values: ['100', '250', '500', '1000', '2500', '5000'],
            default: '500'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['3 Business Days', '5 Business Days', '7 Business Days'],
            default: '5 Business Days'
          }
        },
        features: [
          '8.5" x 11" and 3 other sizes available',
          'Gloss, matte, or uncoated paper options',
          'Single or double-sided printing',
          'Order quantities from 100 to 5,000',
          'Fast turnaround options available'
        ]
      },
      {
        name: 'Event Postcards',
        description: 'Premium postcards ideal for direct mail campaigns, event announcements, and enrollment reminders. Vibrant full-color printing on both sides.',
        priceMin: 39.99,
        priceMax: 249.99,
        category: 'Marketing Materials',
        subcategory: 'Postcards',
        imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600',
        options: {
          size: {
            label: 'Size',
            values: ['4" x 6"', '5" x 7"', '6" x 9"', '6" x 11"'],
            default: '4" x 6"'
          },
          paperType: {
            label: 'Paper Type',
            values: ['14pt Cardstock Gloss', '14pt Cardstock Matte', '16pt Cardstock'],
            default: '14pt Cardstock Gloss'
          },
          coating: {
            label: 'Coating',
            values: ['UV Gloss (Front)', 'UV Matte (Front)', 'No Coating'],
            default: 'UV Gloss (Front)'
          },
          quantity: {
            label: 'Quantity',
            values: ['250', '500', '1000', '2500', '5000'],
            default: '500'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['3 Business Days', '5 Business Days', '7 Business Days'],
            default: '5 Business Days'
          }
        },
        features: [
          '4 size options including EDDM-compatible',
          'Premium cardstock with coating options',
          'Full-color printing front and back',
          'USPS mailing compliant',
          'Bulk pricing available'
        ]
      },
      {
        name: 'Tri-Fold Brochures',
        description: 'Professional tri-fold brochures perfect for program overviews, campus tours, and enrollment information. Full-color printing with multiple paper options.',
        priceMin: 89.99,
        priceMax: 399.99,
        category: 'Marketing Materials',
        subcategory: 'Brochures',
        imageUrl: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=600',
        options: {
          size: {
            label: 'Finished Size',
            values: ['8.5" x 11" (Letter)', '8.5" x 14" (Legal)', '11" x 17" (Tabloid)'],
            default: '8.5" x 11" (Letter)'
          },
          paperType: {
            label: 'Paper Type',
            values: ['100 lb. Gloss Text', '100 lb. Matte Text', '80 lb. Uncoated'],
            default: '100 lb. Gloss Text'
          },
          folding: {
            label: 'Folding',
            values: ['Tri-Fold', 'Half-Fold', 'Z-Fold', 'Gate Fold'],
            default: 'Tri-Fold'
          },
          quantity: {
            label: 'Quantity',
            values: ['100', '250', '500', '1000', '2500'],
            default: '250'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['5 Business Days', '7 Business Days', '10 Business Days'],
            default: '7 Business Days'
          }
        },
        features: [
          'Multiple fold options available',
          'Premium paper stocks',
          'Full-color both sides',
          'Professional scoring and folding',
          'Ideal for enrollment packets'
        ]
      },
      // Business Cards
      {
        name: 'Business Cards',
        description: 'Premium business cards for faculty and staff. Make a great first impression with high-quality cardstock and professional printing.',
        priceMin: 19.99,
        priceMax: 129.99,
        category: 'Marketing Materials',
        subcategory: 'Business Cards',
        imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600',
        options: {
          size: {
            label: 'Size',
            values: ['3.5" x 2" (Standard)', '3.5" x 2.5" (Square Corners)', '2" x 2" (Square)'],
            default: '3.5" x 2" (Standard)'
          },
          paperType: {
            label: 'Paper Type',
            values: ['14pt Cardstock', '16pt Cardstock', '32pt Ultra Thick'],
            default: '14pt Cardstock'
          },
          finish: {
            label: 'Finish',
            values: ['Gloss UV', 'Matte', 'Soft Touch', 'Spot UV'],
            default: 'Gloss UV'
          },
          quantity: {
            label: 'Quantity',
            values: ['250', '500', '1000', '2500'],
            default: '500'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['3 Business Days', '5 Business Days'],
            default: '5 Business Days'
          }
        },
        features: [
          'Premium cardstock options',
          'Multiple finish options',
          'Full-color front and back',
          'Rounded corner option available',
          'Fast turnaround available'
        ]
      },
      // Posters
      {
        name: 'Event Posters',
        description: 'Large format posters for hallways, community boards, and event promotion. High-impact visuals that get attention.',
        priceMin: 14.99,
        priceMax: 199.99,
        category: 'Marketing Materials',
        subcategory: 'Posters',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        options: {
          size: {
            label: 'Size',
            values: ['11" x 17"', '18" x 24"', '24" x 36"', '27" x 40"'],
            default: '18" x 24"'
          },
          paperType: {
            label: 'Paper Type',
            values: ['100 lb. Gloss Text', '100 lb. Matte Text', 'Photo Satin'],
            default: '100 lb. Gloss Text'
          },
          quantity: {
            label: 'Quantity',
            values: ['1', '5', '10', '25', '50', '100'],
            default: '10'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['3 Business Days', '5 Business Days'],
            default: '5 Business Days'
          }
        },
        features: [
          '4 popular size options',
          'Vibrant full-color printing',
          'Premium paper stocks',
          'Great for indoor display',
          'Single poster orders welcome'
        ]
      },

      // ===== SIGNS & BANNERS =====
      {
        name: 'Vinyl Banners',
        description: 'Durable outdoor vinyl banners with grommets. Perfect for enrollment season, events, and campus signage.',
        priceMin: 29.99,
        priceMax: 299.99,
        category: 'Signs & Banners',
        subcategory: 'Banners',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
        options: {
          size: {
            label: 'Size',
            values: ['2\' x 4\'', '3\' x 6\'', '4\' x 8\'', '3\' x 10\'', 'Custom Size'],
            default: '3\' x 6\''
          },
          material: {
            label: 'Material',
            values: ['13oz Vinyl', '18oz Heavy Duty Vinyl', 'Mesh Vinyl (Wind Resistant)'],
            default: '13oz Vinyl'
          },
          finishing: {
            label: 'Finishing',
            values: ['Grommets', 'Pole Pockets', 'Hemmed Edges Only'],
            default: 'Grommets'
          },
          quantity: {
            label: 'Quantity',
            values: ['1', '2', '5', '10'],
            default: '1'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['3 Business Days', '5 Business Days'],
            default: '5 Business Days'
          }
        },
        features: [
          'Weather-resistant vinyl material',
          'Full-color vibrant printing',
          'Grommets included for easy hanging',
          'Indoor or outdoor use',
          'Custom sizes available'
        ]
      },
      {
        name: 'Retractable Banner Stands',
        description: 'Professional retractable banner stands for events, open houses, and lobby displays. Includes carrying case.',
        priceMin: 89.99,
        priceMax: 249.99,
        category: 'Signs & Banners',
        subcategory: 'Banner Stands',
        imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600',
        options: {
          size: {
            label: 'Size',
            values: ['33" x 81"', '36" x 92"', '47" x 81"'],
            default: '33" x 81"'
          },
          standType: {
            label: 'Stand Type',
            values: ['Economy', 'Standard', 'Premium (Wider Base)'],
            default: 'Standard'
          },
          quantity: {
            label: 'Quantity',
            values: ['1', '2', '3', '5'],
            default: '1'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['5 Business Days', '7 Business Days'],
            default: '5 Business Days'
          }
        },
        features: [
          'Retractable design for easy transport',
          'Includes padded carrying case',
          'Sets up in seconds',
          'Premium print quality',
          'Reusable stand with replaceable graphics'
        ]
      },
      {
        name: 'Yard Signs',
        description: 'Corrugated plastic yard signs perfect for enrollment season, events, and directional signage. Includes metal stakes.',
        priceMin: 9.99,
        priceMax: 149.99,
        category: 'Signs & Banners',
        subcategory: 'Yard Signs',
        imageUrl: 'https://images.unsplash.com/photo-1563906267088-b029e7101114?w=600',
        options: {
          size: {
            label: 'Size',
            values: ['12" x 18"', '18" x 24"', '24" x 36"'],
            default: '18" x 24"'
          },
          printedSide: {
            label: 'Printed Side',
            values: ['Single-Sided', 'Double-Sided'],
            default: 'Double-Sided'
          },
          quantity: {
            label: 'Quantity',
            values: ['1', '5', '10', '25', '50', '100'],
            default: '10'
          },
          stakes: {
            label: 'Include Stakes',
            values: ['Yes', 'No'],
            default: 'Yes'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['3 Business Days', '5 Business Days'],
            default: '5 Business Days'
          }
        },
        features: [
          'Durable corrugated plastic',
          'Weather-resistant',
          'Metal stakes included',
          'Single or double-sided printing',
          'Perfect for outdoor placement'
        ]
      },
      {
        name: 'A-Frame Signs',
        description: 'Double-sided A-frame sidewalk signs for entrances, events, and directional signage. Durable plastic construction.',
        priceMin: 79.99,
        priceMax: 199.99,
        category: 'Signs & Banners',
        subcategory: 'A-Frame Signs',
        imageUrl: 'https://images.unsplash.com/photo-1557425955-df376b5903c8?w=600',
        options: {
          size: {
            label: 'Size',
            values: ['24" x 36"', '27" x 46"'],
            default: '24" x 36"'
          },
          frameColor: {
            label: 'Frame Color',
            values: ['Black', 'White'],
            default: 'Black'
          },
          quantity: {
            label: 'Quantity',
            values: ['1', '2', '3', '5'],
            default: '1'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['5 Business Days', '7 Business Days'],
            default: '5 Business Days'
          }
        },
        features: [
          'Double-sided display',
          'Folds flat for storage',
          'Weather-resistant frame',
          'Replaceable graphic inserts',
          'Weighted base for stability'
        ]
      },

      // ===== APPAREL & PROMO =====
      {
        name: 'Custom T-Shirts',
        description: 'High-quality custom t-shirts featuring your school logo and branding. Perfect for staff, students, and events.',
        priceMin: 8.99,
        priceMax: 24.99,
        category: 'Apparel & Promo',
        subcategory: 'T-Shirts',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
        options: {
          style: {
            label: 'Style',
            values: ['Crew Neck', 'V-Neck', 'Long Sleeve'],
            default: 'Crew Neck'
          },
          material: {
            label: 'Material',
            values: ['100% Cotton', '50/50 Blend', 'Tri-Blend'],
            default: '100% Cotton'
          },
          printType: {
            label: 'Print Type',
            values: ['Screen Print', 'Full Color DTG', 'Heat Transfer'],
            default: 'Screen Print'
          },
          quantity: {
            label: 'Quantity',
            values: ['12', '24', '48', '72', '144'],
            default: '24'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['7 Business Days', '10 Business Days', '14 Business Days'],
            default: '10 Business Days'
          }
        },
        features: [
          'Multiple style and material options',
          'Youth and adult sizes available',
          'Multiple print locations available',
          'Bulk pricing discounts',
          'Name/number customization available'
        ]
      },
      {
        name: 'Tote Bags',
        description: 'Reusable canvas tote bags featuring your school branding. Great for welcome packets, events, and everyday use.',
        priceMin: 2.99,
        priceMax: 12.99,
        category: 'Apparel & Promo',
        subcategory: 'Bags',
        imageUrl: 'https://images.unsplash.com/photo-1597484661973-ee6cd0b6482c?w=600',
        options: {
          material: {
            label: 'Material',
            values: ['Cotton Canvas', 'Non-Woven Polypropylene', 'Recycled Cotton'],
            default: 'Cotton Canvas'
          },
          size: {
            label: 'Size',
            values: ['Standard (15" x 16")', 'Large (18" x 18")', 'Grocery Style'],
            default: 'Standard (15" x 16")'
          },
          printType: {
            label: 'Print Type',
            values: ['Screen Print (1 Color)', 'Screen Print (2 Color)', 'Full Color'],
            default: 'Screen Print (1 Color)'
          },
          quantity: {
            label: 'Quantity',
            values: ['50', '100', '250', '500', '1000'],
            default: '100'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['7 Business Days', '10 Business Days'],
            default: '10 Business Days'
          }
        },
        features: [
          'Eco-friendly options available',
          'Long handles for shoulder carry',
          'Durable construction',
          'Multiple print areas available',
          'Great for welcome packets'
        ]
      },
      {
        name: 'Promotional Pens',
        description: 'Quality ballpoint pens with your school name and logo. Perfect for open houses, orientation, and everyday giveaways.',
        priceMin: 0.49,
        priceMax: 2.99,
        category: 'Apparel & Promo',
        subcategory: 'Writing Instruments',
        imageUrl: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600',
        options: {
          style: {
            label: 'Pen Style',
            values: ['Click Ballpoint', 'Twist Ballpoint', 'Stylus Combo', 'Soft Touch'],
            default: 'Click Ballpoint'
          },
          inkColor: {
            label: 'Ink Color',
            values: ['Black', 'Blue', 'Red'],
            default: 'Black'
          },
          quantity: {
            label: 'Quantity',
            values: ['100', '250', '500', '1000', '2500'],
            default: '250'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['7 Business Days', '10 Business Days'],
            default: '10 Business Days'
          }
        },
        features: [
          'Multiple style options',
          'Smooth-writing ink',
          'Durable construction',
          'Full imprint included',
          'Bulk pricing available'
        ]
      },
      {
        name: 'Water Bottles',
        description: 'Reusable water bottles featuring your school branding. BPA-free and perfect for students, staff, and events.',
        priceMin: 3.99,
        priceMax: 14.99,
        category: 'Apparel & Promo',
        subcategory: 'Drinkware',
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600',
        options: {
          style: {
            label: 'Style',
            values: ['Sports Bottle', 'Stainless Steel', 'Tumbler with Straw'],
            default: 'Sports Bottle'
          },
          size: {
            label: 'Size',
            values: ['16 oz', '20 oz', '24 oz', '32 oz'],
            default: '20 oz'
          },
          quantity: {
            label: 'Quantity',
            values: ['25', '50', '100', '250', '500'],
            default: '50'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['10 Business Days', '14 Business Days'],
            default: '10 Business Days'
          }
        },
        features: [
          'BPA-free materials',
          'Multiple size options',
          'Leak-proof lids',
          'Full-color imprint available',
          'Great for athletics and events'
        ]
      },
      {
        name: 'Lanyards',
        description: 'Custom printed lanyards perfect for ID badges, keys, and school spirit. Multiple attachment options available.',
        priceMin: 0.99,
        priceMax: 4.99,
        category: 'Apparel & Promo',
        subcategory: 'Lanyards',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        options: {
          width: {
            label: 'Width',
            values: ['3/8"', '1/2"', '3/4"', '1"'],
            default: '3/4"'
          },
          printType: {
            label: 'Print Type',
            values: ['Screen Print', 'Dye Sublimation (Full Color)', 'Woven'],
            default: 'Screen Print'
          },
          attachment: {
            label: 'Attachment',
            values: ['Swivel Hook', 'Bulldog Clip', 'Split Ring', 'Badge Reel'],
            default: 'Swivel Hook'
          },
          quantity: {
            label: 'Quantity',
            values: ['50', '100', '250', '500', '1000'],
            default: '100'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['10 Business Days', '14 Business Days'],
            default: '10 Business Days'
          }
        },
        features: [
          'Breakaway safety release available',
          'Multiple attachment options',
          'Full-color printing available',
          'Durable polyester material',
          'Great for staff and students'
        ]
      },

      // ===== BOOKLETS & GUIDES =====
      {
        name: 'Enrollment Guides',
        description: 'Comprehensive enrollment guide booklets with all the information families need. Professional saddle-stitch binding.',
        priceMin: 1.99,
        priceMax: 8.99,
        category: 'Booklets & Guides',
        subcategory: 'Enrollment Materials',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
        options: {
          size: {
            label: 'Size',
            values: ['5.5" x 8.5"', '8.5" x 11"'],
            default: '8.5" x 11"'
          },
          pages: {
            label: 'Page Count',
            values: ['8 Pages', '12 Pages', '16 Pages', '20 Pages', '24 Pages'],
            default: '12 Pages'
          },
          paperType: {
            label: 'Paper Type',
            values: ['80 lb. Gloss Text', '100 lb. Gloss Text', '80 lb. Matte'],
            default: '100 lb. Gloss Text'
          },
          cover: {
            label: 'Cover Stock',
            values: ['Self Cover', '80 lb. Cover Gloss', '100 lb. Cover Gloss'],
            default: 'Self Cover'
          },
          quantity: {
            label: 'Quantity',
            values: ['50', '100', '250', '500', '1000'],
            default: '100'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['7 Business Days', '10 Business Days'],
            default: '7 Business Days'
          }
        },
        features: [
          'Saddle-stitch binding',
          'Full-color throughout',
          'Multiple page count options',
          'Premium paper stocks',
          'Perfect for enrollment packets'
        ]
      },
      {
        name: 'Presentation Folders',
        description: 'Professional pocket folders for enrollment packets, welcome materials, and administrative documents.',
        priceMin: 1.49,
        priceMax: 4.99,
        category: 'Booklets & Guides',
        subcategory: 'Folders',
        imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600',
        options: {
          pockets: {
            label: 'Pocket Style',
            values: ['Standard 2-Pocket', 'Reinforced Tab', 'Business Card Slots'],
            default: 'Standard 2-Pocket'
          },
          finish: {
            label: 'Finish',
            values: ['Gloss', 'Matte', 'Soft Touch'],
            default: 'Gloss'
          },
          quantity: {
            label: 'Quantity',
            values: ['50', '100', '250', '500', '1000'],
            default: '100'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['7 Business Days', '10 Business Days'],
            default: '7 Business Days'
          }
        },
        features: [
          '14pt cardstock',
          'Full-color printing both sides',
          'Business card slots available',
          'Multiple pocket configurations',
          'Premium finish options'
        ]
      },

      // ===== TRADE SHOW =====
      {
        name: 'Table Covers',
        description: 'Full-color stretch fabric table covers featuring your school branding. Professional look for any event.',
        priceMin: 99.99,
        priceMax: 249.99,
        category: 'Trade Show',
        subcategory: 'Table Displays',
        imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600',
        options: {
          size: {
            label: 'Table Size',
            values: ['6ft Table', '8ft Table'],
            default: '6ft Table'
          },
          style: {
            label: 'Style',
            values: ['Fitted (4-Sided)', '3-Sided Open Back', 'Throw Style'],
            default: 'Fitted (4-Sided)'
          },
          quantity: {
            label: 'Quantity',
            values: ['1', '2', '3', '5'],
            default: '1'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['7 Business Days', '10 Business Days'],
            default: '7 Business Days'
          }
        },
        features: [
          'Wrinkle-resistant fabric',
          'Machine washable',
          'Full-color dye sublimation',
          'Includes carrying bag',
          'Fits standard folding tables'
        ]
      },
      {
        name: 'Backdrop Displays',
        description: 'Large format backdrop displays for photo ops, events, and major presentations. Includes frame and carrying case.',
        priceMin: 199.99,
        priceMax: 599.99,
        category: 'Trade Show',
        subcategory: 'Backdrops',
        imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600',
        options: {
          size: {
            label: 'Size',
            values: ['8ft x 8ft', '8ft x 10ft', '10ft x 10ft'],
            default: '8ft x 8ft'
          },
          style: {
            label: 'Style',
            values: ['Fabric Pop-Up', 'Tension Fabric', 'Step and Repeat'],
            default: 'Fabric Pop-Up'
          },
          quantity: {
            label: 'Quantity',
            values: ['1', '2'],
            default: '1'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['7 Business Days', '10 Business Days'],
            default: '10 Business Days'
          }
        },
        features: [
          'Portable aluminum frame',
          'Wrinkle-free fabric graphics',
          'Sets up in minutes',
          'Includes carrying case',
          'Replacement graphics available'
        ]
      },
      {
        name: 'Feather Flags',
        description: 'Eye-catching feather flags to attract attention at outdoor events. Includes pole, ground stake, and carrying bag.',
        priceMin: 69.99,
        priceMax: 179.99,
        category: 'Trade Show',
        subcategory: 'Flags',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600',
        options: {
          size: {
            label: 'Height',
            values: ['8ft', '10ft', '12ft', '15ft'],
            default: '12ft'
          },
          shape: {
            label: 'Shape',
            values: ['Feather', 'Teardrop', 'Rectangle'],
            default: 'Feather'
          },
          base: {
            label: 'Base Type',
            values: ['Ground Stake', 'Cross Base (Indoor)', 'Water Base'],
            default: 'Ground Stake'
          },
          quantity: {
            label: 'Quantity',
            values: ['1', '2', '3', '5'],
            default: '1'
          },
          turnaround: {
            label: 'Printing Time',
            values: ['5 Business Days', '7 Business Days'],
            default: '7 Business Days'
          }
        },
        features: [
          'Double-sided printing',
          'Weather-resistant fabric',
          'Flexible fiberglass pole',
          'Multiple base options',
          'Replacement flags available'
        ]
      }
    ];

    for (const product of sampleProducts) {
      Product.create(product);
    }

    console.log(`Seeded ${sampleProducts.length} sample products`);
  }
};
