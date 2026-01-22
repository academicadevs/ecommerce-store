import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new Database(join(dataDir, 'database.sqlite'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      userType TEXT DEFAULT 'school_staff',
      contactName TEXT NOT NULL,
      positionTitle TEXT,
      department TEXT,
      schoolName TEXT,
      principalName TEXT,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'user',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      priceMin REAL NOT NULL,
      priceMax REAL NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      imageUrl TEXT,
      images TEXT,
      options TEXT,
      features TEXT,
      inStock INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      selectedOptions TEXT,
      calculatedPrice REAL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shippingInfo TEXT NOT NULL,
      notes TEXT,
      assignedTo TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (assignedTo) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_notes (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      adminId TEXT NOT NULL,
      note TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (adminId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_communications (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      direction TEXT NOT NULL,
      adminId TEXT,
      senderEmail TEXT NOT NULL,
      recipientEmail TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      replyToToken TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (adminId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS proofs (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      orderItemId TEXT,
      version INTEGER DEFAULT 1,
      title TEXT,
      fileUrl TEXT NOT NULL,
      fileType TEXT,
      status TEXT DEFAULT 'pending',
      accessToken TEXT UNIQUE NOT NULL,
      expiresAt TEXT NOT NULL,
      signedOffAt TEXT,
      signedOffBy TEXT,
      signature TEXT,
      signatureType TEXT,
      createdBy TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS proof_annotations (
      id TEXT PRIMARY KEY,
      proofId TEXT NOT NULL,
      type TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL,
      height REAL,
      page INTEGER DEFAULT 1,
      comment TEXT NOT NULL,
      authorName TEXT NOT NULL,
      authorEmail TEXT,
      resolved INTEGER DEFAULT 0,
      resolvedAt TEXT,
      resolvedBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proofId) REFERENCES proofs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(userId);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(userId);
    CREATE INDEX IF NOT EXISTS idx_order_communications ON order_communications(orderId);
    CREATE INDEX IF NOT EXISTS idx_order_communications_token ON order_communications(replyToToken);
    CREATE INDEX IF NOT EXISTS idx_proofs_order ON proofs(orderId);
    CREATE INDEX IF NOT EXISTS idx_proofs_token ON proofs(accessToken);
    CREATE INDEX IF NOT EXISTS idx_proof_annotations ON proof_annotations(proofId);
  `);

  // Migration: Add new columns if they don't exist
  try {
    db.exec(`ALTER TABLE users ADD COLUMN middleName TEXT`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN positionTitle TEXT`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN principalName TEXT`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN userType TEXT DEFAULT 'school_staff'`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN department TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Migration: Add assignedTo column to orders if it doesn't exist
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN assignedTo TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Migration: Add orderNumber column to orders if it doesn't exist
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN orderNumber TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Backfill orderNumber for existing orders that don't have one
  // Format: XXXX-MMDDYY-NNN (name initials - date - daily sequence)
  try {
    const ordersWithoutNumber = db.prepare(`
      SELECT o.id, o.createdAt, o.shippingInfo, u.contactName as userContactName
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      WHERE o.orderNumber IS NULL OR o.orderNumber LIKE 'ORD-%'
      ORDER BY o.createdAt ASC
    `).all();

    if (ordersWithoutNumber.length > 0) {
      const updateStmt = db.prepare(`UPDATE orders SET orderNumber = ? WHERE id = ?`);
      const dailyCounts = {};

      ordersWithoutNumber.forEach((order) => {
        // Get contact name from shippingInfo or user
        let contactName = 'Unknown User';
        try {
          const shippingInfo = JSON.parse(order.shippingInfo || '{}');
          contactName = shippingInfo.contactName || order.userContactName || 'Unknown User';
        } catch (e) {
          contactName = order.userContactName || 'Unknown User';
        }

        // Generate name prefix
        const nameParts = contactName.trim().split(/\s+/);
        const firstName = nameParts[0] || 'XX';
        const lastName = nameParts[nameParts.length - 1] || 'XX';
        const namePrefix = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();

        // Generate date string
        const date = new Date(order.createdAt);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        const dateStr = `${month}${day}${year}`;

        // Track daily sequence
        const dateKey = `${month}${day}${year}`;
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;

        const orderNumber = `${namePrefix}-${dateStr}-${dailyCounts[dateKey].toString().padStart(3, '0')}`;
        updateStmt.run(orderNumber, order.id);
      });
      console.log(`Backfilled ${ordersWithoutNumber.length} order numbers`);
    }
  } catch (e) {
    console.error('Error backfilling order numbers:', e.message);
  }

  // Create order_notes table if it doesn't exist (for existing databases)
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_notes (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      adminId TEXT NOT NULL,
      note TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (adminId) REFERENCES users(id)
    );
  `);

  // Create indexes after migrations (to avoid errors on existing databases)
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_assigned ON orders(assignedTo);`);
  } catch (e) {
    // Index might already exist
  }
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_order_notes ON order_notes(orderId);`);
  } catch (e) {
    // Index might already exist
  }

  // Migration: Add attachments column to order_communications
  try {
    db.exec(`ALTER TABLE order_communications ADD COLUMN attachments TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Migration: Add messageId column for email threading
  try {
    db.exec(`ALTER TABLE order_communications ADD COLUMN messageId TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Migration: Add readByAdmin column to order_communications for notification tracking
  try {
    db.exec(`ALTER TABLE order_communications ADD COLUMN readByAdmin INTEGER DEFAULT 0`);
  } catch (e) {
    // Column already exists
  }

  // Migration: Add readByAdmin column to proof_annotations for notification tracking
  try {
    db.exec(`ALTER TABLE proof_annotations ADD COLUMN readByAdmin INTEGER DEFAULT 0`);
  } catch (e) {
    // Column already exists
  }

  // Migration: Add sortOrder column to products for custom ordering
  try {
    db.exec(`ALTER TABLE products ADD COLUMN sortOrder INTEGER DEFAULT 0`);
  } catch (e) {
    // Column already exists
  }

  // Backfill sortOrder for existing products (order by category, then name)
  try {
    const productsWithoutOrder = db.prepare(`
      SELECT id FROM products WHERE sortOrder = 0 OR sortOrder IS NULL
      ORDER BY category, name
    `).all();

    if (productsWithoutOrder.length > 0) {
      const updateStmt = db.prepare(`UPDATE products SET sortOrder = ? WHERE id = ?`);
      productsWithoutOrder.forEach((product, index) => {
        updateStmt.run(index + 1, product.id);
      });
      console.log(`Backfilled sortOrder for ${productsWithoutOrder.length} products`);
    }
  } catch (e) {
    console.error('Error backfilling product sortOrder:', e.message);
  }

  // Migration: Add overview column to products for detailed product information
  try {
    db.exec(`ALTER TABLE products ADD COLUMN overview TEXT`);
    console.log('Added overview column to products table');
  } catch (e) {
    // Column already exists
  }

  // Backfill overview data for products
  try {
    const productsWithoutOverview = db.prepare(`
      SELECT id, name FROM products WHERE overview IS NULL
    `).all();

    if (productsWithoutOverview.length > 0) {
      const overviewData = getProductOverviews();
      const updateStmt = db.prepare(`UPDATE products SET overview = ? WHERE name = ?`);
      let updatedCount = 0;

      for (const product of productsWithoutOverview) {
        if (overviewData[product.name]) {
          updateStmt.run(JSON.stringify(overviewData[product.name]), product.name);
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        console.log(`Backfilled overview for ${updatedCount} products`);
      }
    }
  } catch (e) {
    console.error('Error backfilling product overviews:', e.message);
  }

  console.log('Database initialized successfully');
}

// Product overview content for backfill migration
function getProductOverviews() {
  return {
    'Business Flyers': {
      headline: 'Business flyer printing that boosts your brand.',
      quote: "Flyers don't just call a customer's attention—they can easily shift their focus to your school and what it has to offer.",
      content: 'Business flyer printing has been used for decades to inform both current and prospective families about school programs, events, and enrollment opportunities. Promotional flyers are also used to announce major updates such as new programs, enrollment periods, or campus changes. They are easy to hand out in high foot traffic areas, letting you target specific audiences.',
      sections: [
        { type: 'intro', title: 'How to Choose the Best Paper Type', intro: 'We offer three kinds of paper stock and two cardstock options. The choice will depend on your preferred material thickness and the distribution method of the marketing flyers.' },
        { type: 'comparison-grid', title: 'Paper Stock Options', columns: [
          { name: '70 lb. Paper', bullets: ['The thinnest paper type, with the same feel and weight as notebook paper.', 'Recommended for flyers that will travel and land flat on surfaces in high-traffic areas.'] },
          { name: '80 lb. Paper', bullets: ['Has the same weight as magazine paper, providing more durability than 70 lb. paper.', 'The best choice for those who want the flexibility and ease of lightweight paper but with additional durability.'] },
          { name: '100 lb. Paper', bullets: ['The thickest paper option available and also known as cover paper.', 'It has the same thickness as office folder covers, so it feels substantial in your hands.', 'Best for flyers for special events.'] }
        ]},
        { type: 'comparison-grid', title: 'Cardstock Choices', columns: [
          { name: '10 pt. Cardstock', bullets: ['Much thicker than paper but still foldable.', 'This material is normally used for postcards and greeting cards.'] },
          { name: '14 pt. Cardstock', bullets: ['Is our thickest and toughest material available.', 'Works best for flyers that will be distributed in waiting rooms or in meeting rooms.'] }
        ]},
        { type: 'coating-options', title: 'What to Expect With Our Coating Options', intro: 'Your coating option determines the finish and feel of your business flyer design.', options: [
          { name: 'Matte', description: 'Gives your custom paper prints a non-reflective, even-toned finish.', bullets: ['Provides a modern look that features sleek designs with simpler text.'] },
          { name: 'Gloss', description: 'Adds that extra pop to your flyer design colors.', bullets: ['Expect an extra vibrance to the surface that adds that extra sparkle.'] },
          { name: 'High Gloss UV', description: 'A shinier-than-glossy and more noticeable reflectivity.', bullets: ['Able to withstand frequent handling and is resistant to abrasion.'] },
          { name: 'Uncoated', description: 'Is available for our 70 lb. paper and 14 pt. cardstock.', bullets: ['Has a toned down texture that provides a soft surface suitable to write on.'] }
        ]},
        { type: 'faq', title: 'Business Flyer Q&A', questions: [
          { q: 'What paper weight should I use?', a: 'If you want flyers that feel substantial and have a coating, cardstock is the perfect choice. Unlike standard paper, cardstock offers weight, durability, and a premium feel.' },
          { q: 'Which finish is best for colorful designs?', a: 'For flyers with vibrant colors and images, gloss finish will make those colors pop. If your design is more text-heavy or minimalist, matte provides a sophisticated look without glare.' },
          { q: 'How do I prepare my file for printing?', a: 'Ensure your file is in CMYK color mode with 300 DPI resolution. Include a 0.125" bleed on all sides and keep important text at least 0.25" from the trim edge.' }
        ]}
      ]
    },
    'Event Postcards': {
      headline: 'Custom postcards that deliver your message directly.',
      quote: 'Postcards create a personal connection with families—they arrive directly in their hands with your school message front and center.',
      content: 'Custom postcard printing is a versatile promotional tool that fits every step of your enrollment journey. From acquisition to retention, postcards are a great way to connect with families on a personal level. Studies show direct mail has response rates of 4.25%, significantly higher than digital marketing channels alone.',
      sections: [
        { type: 'intro', title: 'Choosing the Right Postcard Size', intro: 'Different sizes serve different purposes. Consider your message length, mailing requirements, and distribution method when selecting.' },
        { type: 'comparison-grid', title: 'Size Options', columns: [
          { name: '4" x 6"', bullets: ['The most affordable and compact option.', 'Perfect for quick announcements and event reminders.', 'Can be mailed with a standard postcard stamp.'] },
          { name: '5" x 7"', bullets: ['Stands out against standard mail.', 'Great balance between images and copy.', 'Ideal for open house invitations.'] },
          { name: '6" x 9"', bullets: ['Large format for maximum impact.', 'Room for detailed event information.', 'Eye-catching in any mailbox.'] },
          { name: '6" x 11"', bullets: ['EDDM-compatible for Every Door Direct Mail.', 'Reach entire neighborhoods affordably.', 'Maximum space for your message.'] }
        ]},
        { type: 'faq', title: 'Postcard Q&A', questions: [
          { q: 'Can I mail postcards directly?', a: 'Yes! All our postcards meet USPS mailing requirements. 4" x 6" can use postcard stamps, while larger sizes require first-class postage.' },
          { q: 'What is EDDM and should I use it?', a: 'Every Door Direct Mail (EDDM) lets you send to every address in specific postal routes without needing a mailing list. Perfect for reaching entire neighborhoods around your school.' }
        ]}
      ]
    },
    'Tri-Fold Brochures': {
      headline: 'Professional brochures that tell your complete story.',
      quote: 'A well-designed brochure gives families everything they need to know about your school in one beautiful, portable package.',
      content: 'Brochure printing is part of every successful enrollment campaign. Give away brochures at open houses, highlight details about your programs, or include them with enrollment packets. They are effective, versatile, and affordable promotional tools that showcase your school professionally.',
      sections: [
        { type: 'intro', title: 'Understanding Fold Options', intro: 'Different folds create different reading experiences. Choose based on how you want to present your information and guide the reader through your content.' },
        { type: 'comparison-grid', title: 'Fold Types', columns: [
          { name: 'Tri-Fold', bullets: ['The most popular choice for brochures.', 'Six panels that unfold naturally.', 'Perfect for program overviews.', 'Fits standard #10 envelopes.'] },
          { name: 'Z-Fold', bullets: ['Panels fold in alternating directions.', 'Creates a storytelling effect.', 'Each panel reveals the next.', 'Great for step-by-step information.'] },
          { name: 'Half-Fold', bullets: ['Simple four-panel layout.', 'Large panels for big images.', 'Works like a small booklet.', 'Best for simple information.'] },
          { name: 'Gate Fold', bullets: ['Two panels open like doors.', 'Creates a dramatic reveal.', 'Perfect for hero images.', 'Premium, impressive feel.'] }
        ]},
        { type: 'faq', title: 'Brochure Q&A', questions: [
          { q: 'What size brochure should I choose?', a: '8.5" x 11" (letter size) is the most common and cost-effective. It folds to fit standard envelopes and provides ample space for content.' },
          { q: 'Do you fold the brochures for me?', a: 'Yes! All brochures come professionally scored and folded, ready for distribution.' }
        ]}
      ]
    },
    'Business Cards': {
      headline: 'Premium business cards that make a lasting impression.',
      quote: 'Your business card is often the first tangible piece of your school that families take home—make it memorable.',
      content: 'A quality business card speaks volumes about your school professionalism. From faculty to administrators, everyone benefits from having a card they are proud to hand out at open houses, community events, and parent meetings.',
      sections: [
        { type: 'intro', title: 'Choosing the Right Cardstock', intro: 'The weight and feel of your card communicates quality before anyone reads a word.' },
        { type: 'comparison-grid', title: 'Cardstock Options', columns: [
          { name: '14 pt. Cardstock', bullets: ['Our standard professional option.', 'Substantial feel without being bulky.', 'Works with all finish options.'] },
          { name: '16 pt. Cardstock', bullets: ['Noticeably thicker and sturdier.', 'Premium feel that impresses.', 'Extra durability for frequent use.'] },
          { name: '32 pt. Ultra Thick', bullets: ['Maximum thickness available.', 'Luxury feel that stands out.', 'Makes a bold statement.'] }
        ]},
        { type: 'coating-options', title: 'Finish Options', intro: 'The right finish adds a professional touch and protects your cards.', options: [
          { name: 'Gloss UV', description: 'High-shine protective finish.', bullets: ['Makes colors vibrant', 'Protects against fingerprints'] },
          { name: 'Matte', description: 'Smooth, non-reflective finish.', bullets: ['Sophisticated appearance', 'Easy to write notes on'] },
          { name: 'Soft Touch', description: 'Velvety, luxurious texture.', bullets: ['Unique tactile experience', 'Premium impression'] },
          { name: 'Spot UV', description: 'Glossy accents on matte background.', bullets: ['Highlights logos and text', 'Creates visual depth'] }
        ]},
        { type: 'faq', title: 'Business Card Q&A', questions: [
          { q: 'What is the standard business card size?', a: '3.5" x 2" is the standard size that fits all card holders and wallets. We also offer square and other custom sizes.' },
          { q: 'Can I get rounded corners?', a: 'Yes! Rounded corners are available and add a modern touch to your cards.' }
        ]}
      ]
    },
    'Event Posters': {
      headline: 'Large format posters that demand attention.',
      quote: 'A striking poster in the right location can reach hundreds of families every day—advertising that works around the clock.',
      content: 'Large format posters showcase your school at events, in hallways, and on community boards. High-quality printing brings out vibrant colors and sharp details that capture attention from across the room.',
      sections: [
        { type: 'intro', title: 'Choosing the Right Poster Size', intro: 'Size matters when it comes to posters. Consider viewing distance, display location, and the amount of information you need to include.' },
        { type: 'comparison-grid', title: 'Popular Sizes', columns: [
          { name: '11" x 17"', bullets: ['Compact and versatile.', 'Perfect for bulletin boards.', 'Easy to frame and display.'] },
          { name: '18" x 24"', bullets: ['Medium format, big impact.', 'Ideal for hallway displays.', 'Readable from 10-15 feet.'] },
          { name: '24" x 36"', bullets: ['Large format statement piece.', 'Commands attention in any space.', 'Visible from 20+ feet away.'] },
          { name: '27" x 40"', bullets: ['Maximum standard size.', 'Theater poster dimensions.', 'Impossible to ignore.'] }
        ]},
        { type: 'faq', title: 'Poster Q&A', questions: [
          { q: 'Can I order just one poster?', a: 'Absolutely! We have no minimum order. Order one poster or hundreds—whatever you need.' },
          { q: 'Are posters suitable for outdoor use?', a: 'Standard paper posters are best for indoor use. For outdoor display, consider our mounted posters or vinyl banners.' }
        ]}
      ]
    },
    'Vinyl Banners': {
      headline: 'Durable vinyl banners built to last outdoors.',
      quote: 'Whether rain or shine, your message stays bold and vibrant—vinyl banners are the workhorses of outdoor advertising.',
      content: 'Vinyl banners are made of durable, weather-resistant material that withstands rain, wind, and sun exposure. Your message stays readable and colors stay vibrant even after months of outdoor display.',
      sections: [
        { type: 'intro', title: 'Understanding Vinyl Materials', intro: 'Different vinyl weights offer different benefits. Choose based on where you will display your banner and how long you need it to last.' },
        { type: 'comparison-grid', title: 'Material Options', columns: [
          { name: '13 oz. Vinyl', bullets: ['Our standard banner material.', 'Lasts 3-5 years outdoors.', 'Great for most applications.', 'Cost-effective choice.'] },
          { name: '18 oz. Heavy Duty', bullets: ['Extra thick and durable.', 'Lasts up to 5+ years outdoors.', 'Withstands high winds.', 'Best for permanent signage.'] },
          { name: 'Mesh Vinyl', bullets: ['Perforated for wind resistance.', 'Allows 30% wind pass-through.', 'Ideal for fences and poles.', 'Perfect for windy locations.'] }
        ]},
        { type: 'comparison-grid', title: 'Finishing Options', columns: [
          { name: 'Grommets', bullets: ['Metal rings for rope/hook hanging.', 'Placed every 2-3 feet.', 'Easy installation.'] },
          { name: 'Pole Pockets', bullets: ['Sewn pockets at top/bottom.', 'Insert poles for hanging.', 'Clean, professional look.'] },
          { name: 'Hemmed Edges', bullets: ['Reinforced edges only.', 'No grommets or pockets.', 'For frame mounting.'] }
        ]},
        { type: 'faq', title: 'Vinyl Banner Q&A', questions: [
          { q: 'How do I hang my banner?', a: 'Use the grommets with rope, bungee cords, zip ties, or hooks. For pole pockets, slide a dowel or pipe through and hang from brackets.' },
          { q: 'Can I reuse my banner?', a: 'Yes! Vinyl banners can be rolled up and stored for reuse. Store in a cool, dry place and roll (do not fold) to prevent creases.' }
        ]}
      ]
    },
    'Retractable Banner Stands': {
      headline: 'Professional displays that set up in seconds.',
      quote: 'From packed away to picture-perfect in under a minute—retractable banners make every event setup effortless.',
      content: 'Retractable banners help you stand out at open houses, conferences, and community events. These portable displays capture attention with bright graphics on a tall, sturdy frame.',
      sections: [
        { type: 'intro', title: 'Choosing the Right Stand', intro: 'Different stands offer different features and durability levels. Consider how often you will use it and where it will be displayed.' },
        { type: 'comparison-grid', title: 'Stand Types', columns: [
          { name: 'Economy Stand', bullets: ['Budget-friendly option.', 'Great for occasional use.', 'Lightweight aluminum frame.'] },
          { name: 'Standard Stand', bullets: ['Best value for regular use.', 'Durable construction.', 'Smooth retraction mechanism.'] },
          { name: 'Premium Stand', bullets: ['Heavy-duty for frequent use.', 'Wider base for stability.', 'Swappable graphic cassettes.'] }
        ]},
        { type: 'faq', title: 'Retractable Banner Q&A', questions: [
          { q: 'Can I replace just the graphic?', a: 'Yes! Our premium stands have replaceable cassettes. For other stands, we can print replacement graphics that you install yourself.' },
          { q: 'How long do retractable banners last?', a: 'With proper care, the stand lasts for years. Graphics typically look great for 1-3 years of regular use.' }
        ]}
      ]
    },
    'Yard Signs': {
      headline: 'Weatherproof yard signs that get your message noticed.',
      quote: 'Strategically placed yard signs turn every corner of your community into an advertisement for your school.',
      content: 'Yard signs are versatile, cost-effective tools for promoting enrollment, events, and campus directions. Made of durable corrugated plastic that withstands outdoor conditions.',
      sections: [
        { type: 'intro', title: 'Understanding Corrugated Plastic', intro: 'Our yard signs are made from 4mm corrugated plastic, a weather-resistant material that is both durable and lightweight.' },
        { type: 'comparison-grid', title: 'Size Options', columns: [
          { name: '12" x 18"', bullets: ['Compact and economical.', 'Perfect for directional arrows.', 'Easy to place anywhere.'] },
          { name: '18" x 24"', bullets: ['Our most popular size.', 'Visible from the street.', 'Room for logo and message.'] },
          { name: '24" x 36"', bullets: ['Maximum visibility.', 'Readable from moving cars.', 'Best for high-traffic areas.'] }
        ]},
        { type: 'faq', title: 'Yard Sign Q&A', questions: [
          { q: 'How long will yard signs last outside?', a: 'Our corrugated plastic signs typically last 1-2 years in normal outdoor conditions. UV-resistant inks help maintain color vibrancy.' },
          { q: 'Should I get single or double-sided?', a: 'Double-sided is recommended for most applications so your message is visible from both directions.' }
        ]}
      ]
    },
    'A-Frame Signs': {
      headline: 'Sidewalk signs that guide and inform.',
      quote: 'Position your message exactly where families will see it—A-frame signs put your school front and center.',
      content: 'Double-sided A-frame signs are perfect for entrances, events, and directional signage. The sturdy frame folds flat for easy storage and transport.',
      sections: [
        { type: 'intro', title: 'A-Frame Sign Benefits', intro: 'A-frame signs (also called sandwich boards) are portable, versatile, and instantly noticeable.' },
        { type: 'comparison-grid', title: 'Size Options', columns: [
          { name: '24" x 36"', bullets: ['Standard sidewalk size.', 'Easy to move and store.', 'Fits through doorways.'] },
          { name: '27" x 46"', bullets: ['Larger format for more content.', 'Greater visibility from distance.', 'Better for spacious areas.'] }
        ]},
        { type: 'faq', title: 'A-Frame Sign Q&A', questions: [
          { q: 'Can I change the graphics myself?', a: 'Yes! Our A-frames have slide-in graphic panels that are easy to swap out whenever you want to update your message.' },
          { q: 'Are they suitable for outdoor use?', a: 'Yes, our A-frames are weather-resistant. However, we recommend bringing them inside during severe weather.' }
        ]}
      ]
    },
    'Enrollment Guides': {
      headline: 'Comprehensive booklets that inform and inspire.',
      quote: 'Give families a complete picture of your school—enrollment guides answer questions before they are even asked.',
      content: 'Custom booklets serve as versatile tools for showcasing your programs, creating detailed enrollment guides, and providing comprehensive information to families.',
      sections: [
        { type: 'intro', title: 'Understanding Booklet Binding', intro: 'The binding method affects both the look and functionality of your booklet.' },
        { type: 'comparison-grid', title: 'Binding Options', columns: [
          { name: 'Saddle-Stitch', bullets: ['Stapled at the spine fold.', 'Lies flat when open.', 'Best for up to 64 pages.', 'Most affordable option.'] },
          { name: 'Perfect Binding', bullets: ['Glued spine like paperbacks.', 'Professional book appearance.', 'Best for 48+ pages.'] },
          { name: 'Wire-O Binding', bullets: ['Metal wire spiral.', 'Opens completely flat.', 'Pages can fold back.', 'Great for reference guides.'] }
        ]},
        { type: 'faq', title: 'Booklet Q&A', questions: [
          { q: 'What page counts are available?', a: 'Saddle-stitch booklets must have page counts in multiples of 4 (8, 12, 16, 20, etc.). We offer options from 8 to 64 pages.' },
          { q: 'Can I have different paper for the cover?', a: 'Yes! Choose self-cover for the same paper throughout, or upgrade to a heavier cover stock for a more substantial feel.' }
        ]}
      ]
    },
    'Presentation Folders': {
      headline: 'Professional folders that organize and impress.',
      quote: 'First impressions matter—a quality presentation folder shows families you care about every detail.',
      content: 'Pocket folders are versatile, classic tools perfect for enrollment packets, welcome materials, and administrative documents.',
      sections: [
        { type: 'intro', title: 'Choosing the Right Folder', intro: 'Different folder styles serve different needs. Consider what materials you will include and how the folder will be used.' },
        { type: 'comparison-grid', title: 'Size Options', columns: [
          { name: '4" x 9"', bullets: ['Compact format.', 'Fits #10 envelopes.', 'Great for brochures.'] },
          { name: '9" x 12"', bullets: ['Standard letter size.', 'Holds 8.5" x 11" sheets.', 'Most popular choice.'] },
          { name: '9" x 14.5"', bullets: ['Legal size capacity.', 'Extra tall for documents.', 'Stands out from others.'] }
        ]},
        { type: 'comparison-grid', title: 'Pocket Styles', columns: [
          { name: 'Standard Two-Pocket', bullets: ['Classic configuration.', 'Pockets on left and right.', 'Organize by category.'] },
          { name: 'Reinforced Tab', bullets: ['Extra durability.', 'Tabbed for filing.', 'Heavy-duty use.'] },
          { name: 'Business Card Slots', bullets: ['Built-in card holders.', 'Right and/or left pockets.', 'Professional touch.'] }
        ]},
        { type: 'faq', title: 'Folder Q&A', questions: [
          { q: 'What cardstock weight is used?', a: 'Our folders are printed on sturdy 14pt or 16pt cardstock, thick enough to feel substantial and protect your documents.' },
          { q: 'Can I print inside the pockets?', a: 'Yes! The inside panels and pockets can be printed, which is great for adding additional information or reinforcing your branding.' }
        ]}
      ]
    },
    'Table Covers': {
      headline: 'Custom table covers that transform your display.',
      quote: 'Turn any folding table into a branded booth—table covers make your school look professional anywhere.',
      content: 'Transform any table into a branded display with custom stretch table covers. Made of durable, stain-resistant polyester fabric with vibrant dye-sublimation printing.',
      sections: [
        { type: 'intro', title: 'Understanding Table Cover Styles', intro: 'Different styles offer different benefits. Consider your typical setup needs and how you will use the cover.' },
        { type: 'comparison-grid', title: 'Style Options', columns: [
          { name: 'Fitted (4-Sided)', bullets: ['Complete coverage all sides.', 'Sleek, tailored appearance.', 'Leg pockets keep it secure.'] },
          { name: '3-Sided Open Back', bullets: ['Front, sides, and top covered.', 'Open back for storage access.', 'Reach supplies easily.'] },
          { name: 'Throw Style', bullets: ['Draped over the table.', 'Easy to put on and adjust.', 'Casual, elegant look.'] }
        ]},
        { type: 'faq', title: 'Table Cover Q&A', questions: [
          { q: 'How long will my table cover last?', a: 'With proper care, table covers last 3-5 years. The dye-sublimation printing will not fade, peel, or crack.' },
          { q: 'Can I machine wash the cover?', a: 'Yes! Wash on cold with mild detergent. Air dry or tumble dry on low. No bleach or fabric softeners.' }
        ]}
      ]
    },
    'Backdrop Displays': {
      headline: 'Large format backdrops that make an impact.',
      quote: 'Create the perfect photo opportunity—branded backdrops turn every event into a shareable moment.',
      content: 'Make a big impact at events with large format backdrop displays. Perfect for photo opportunities, presentations, and major announcements.',
      sections: [
        { type: 'intro', title: 'Choosing the Right Backdrop', intro: 'Different backdrop styles work better for different events. Consider your primary use case, space constraints, and setup time.' },
        { type: 'comparison-grid', title: 'Style Options', columns: [
          { name: 'Fabric Pop-Up', bullets: ['Collapsible frame design.', 'Sets up in minutes.', 'Lightweight and portable.'] },
          { name: 'Tension Fabric', bullets: ['Sleek, modern appearance.', 'Seamless graphics.', 'Premium, wrinkle-free look.'] },
          { name: 'Step and Repeat', bullets: ['Repeating logo pattern.', 'Classic media wall style.', 'Perfect for photos.'] }
        ]},
        { type: 'faq', title: 'Backdrop Q&A', questions: [
          { q: 'How long does setup take?', a: 'Pop-up frames take about 5-10 minutes to set up. Tension fabric frames may take 10-15 minutes. No tools required.' },
          { q: 'Can I replace just the graphic?', a: 'Yes! We sell replacement graphics for all our frames, so you can update your design without buying a new frame.' }
        ]}
      ]
    },
    'Feather Flags': {
      headline: 'Eye-catching flags that flutter and attract.',
      quote: 'Movement catches the eye—feather flags wave hello to every family that passes by.',
      content: 'Eye-catching feather flags attract attention at outdoor events, open houses, and campus entrances. The flutter motion naturally draws the eye.',
      sections: [
        { type: 'intro', title: 'Understanding Flag Options', intro: 'Feather flags come in various sizes and configurations. Choose based on your display location and visibility needs.' },
        { type: 'comparison-grid', title: 'Size Options', columns: [
          { name: '8ft Flag', bullets: ['Compact size.', 'Great for indoor use.', 'Fits under ceilings.'] },
          { name: '10ft Flag', bullets: ['Medium visibility.', 'Works indoor/outdoor.', 'Good street presence.'] },
          { name: '12ft Flag', bullets: ['High visibility.', 'Stands out from distance.', 'Great for entrances.'] },
          { name: '15ft Flag', bullets: ['Maximum height.', 'Visible from far away.', 'Makes a statement.'] }
        ]},
        { type: 'comparison-grid', title: 'Base Options', columns: [
          { name: 'Ground Stake', bullets: ['Steel spike for grass.', 'Quick installation.', 'Very stable.'] },
          { name: 'Cross Base', bullets: ['X-shaped floor stand.', 'For hard surfaces.', 'Indoor events.'] },
          { name: 'Water Base', bullets: ['Weighted base.', 'Fill with water/sand.', 'Maximum stability.'] }
        ]},
        { type: 'faq', title: 'Feather Flag Q&A', questions: [
          { q: 'Single or double-sided printing?', a: 'Single-sided shows a mirror image on the reverse. Double-sided has a blocker layer for two distinct, non-mirrored sides.' },
          { q: 'Can I wash my feather flag?', a: 'Yes! Machine wash cold on gentle cycle or hand wash. Air dry completely before storing.' }
        ]}
      ]
    }
  };
}

export default db;
