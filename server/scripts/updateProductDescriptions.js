import db from '../utils/database.js';

// Updated product descriptions based on UPrinting.com content
const productDescriptions = {
  'Business Flyers': {
    description: 'Flyers are powerful marketing tools perfect for promoting events, enrollment campaigns, and special announcements. Choose from multiple sizes including the popular 8.5" x 11" format that provides plenty of space for text and visuals. Available in gloss, matte, or uncoated paper options with single or double-sided printing.',
  },
  'Event Postcards': {
    description: 'Custom postcards are an affordable and effective way to reach current and prospective families with your latest announcements, events, and enrollment information. Printed on premium cardstock with vibrant full-color printing, postcards deliver your message directly into the hands of your audience. Perfect for direct mail campaigns and handouts.',
  },
  'Tri-Fold Brochures': {
    description: 'Brochure printing is part of every successful marketing campaign. Give away brochures at open houses, highlight details about your programs, or include them with enrollment packets. These versatile, affordable promotional tools offer multiple fold options and premium paper stocks to showcase your school professionally.',
  },
  'Business Cards': {
    description: 'Make a lasting first impression with premium custom business cards. Available in classic 2" x 3.5" format and other sizes, printed on thick cardstock with your choice of gloss, matte, or specialty finishes. Perfect for faculty, staff, and administrators to share contact information professionally.',
  },
  'Event Posters': {
    description: 'Large format posters showcase your school at events, in hallways, and on community boards. High-quality printing brings out vibrant colors and sharp details. Available in sizes from 11" x 17" up to 27" x 40", perfect for promoting events, celebrating achievements, and sharing important announcements.',
  },
  'Vinyl Banners': {
    description: 'Durable vinyl banners are built to last outdoors in all weather conditions. Made of weather-resistant, waterproof material that stays readable even after exposure to wind and rain. Choose from standard 13oz vinyl for 3-5 year outdoor life or heavy-duty 18oz vinyl for maximum durability. Add grommets, pole pockets, or hemmed edges for easy hanging.',
  },
  'Retractable Banner Stands': {
    description: 'Stand out at open houses, conferences, and events with professional retractable banners. These portable displays capture attention with bright graphics on a tall, sturdy frame. Easy to set up in seconds and stores compactly in the included carrying case. Perfect for trade shows, lobby displays, and recruitment events.',
  },
  'Yard Signs': {
    description: 'Yard signs are versatile, cost-effective tools for promoting enrollment, events, and campus directions. Made of durable corrugated plastic that withstands rain, wind, and outdoor conditions. Lightweight and portable, they can be quickly installed with included metal stakes. Available in custom shapes including oval, circle, house, and arrow designs.',
  },
  'A-Frame Signs': {
    description: 'Double-sided A-frame sidewalk signs are perfect for entrances, events, and directional signage. The sturdy frame folds flat for easy storage and transport. Weather-resistant construction with replaceable graphic inserts means you can update your message anytime. Ideal for guiding visitors around campus.',
  },
  'Enrollment Guides': {
    description: 'Custom booklets serve as versatile tools for showcasing your programs, creating detailed enrollment guides, and providing comprehensive information to families. Saddle-stitch binding creates a professional, neat appearance that lies flat for easy reading. Available in multiple sizes with full-color printing throughout.',
  },
  'Presentation Folders': {
    description: 'Pocket folders are versatile, classic tools perfect for enrollment packets, welcome materials, and administrative documents. Whether delivering information at open houses, parent meetings, or orientation events, these folders give off a polished, professional image. Printed on thick, durable cardstock with your choice of gloss, matte, or premium finishes.',
  },
  'Table Covers': {
    description: 'Transform any table into a branded display with custom stretch table covers. Made of durable, stain-resistant polyester fabric with vibrant dye-sublimation printing. The stretch design fits snugly over standard folding tables, removing wrinkles for a professional look. Machine washable and reusable for years of events.',
  },
  'Backdrop Displays': {
    description: 'Make a big impact at events with large format backdrop displays. Perfect for photo opportunities, presentations, and major announcements. The portable aluminum frame sets up in minutes and includes a carrying case for easy transport. Wrinkle-free fabric graphics create a professional backdrop for any occasion.',
  },
  'Feather Flags': {
    description: 'Eye-catching feather flags attract attention at outdoor events, open houses, and campus entrances. Made from durable, washable polyester fabric suitable for both indoor and outdoor use. Choose from multiple base options including ground stakes for grass, cross bases for hard surfaces, or water-weighted bases for added stability.',
  },
};

// Update products in database
function updateProductDescriptions() {
  const updateStmt = db.prepare(`
    UPDATE products
    SET description = ?, updatedAt = ?
    WHERE name = ?
  `);

  const now = new Date().toISOString();
  let updatedCount = 0;

  for (const [productName, data] of Object.entries(productDescriptions)) {
    const result = updateStmt.run(data.description, now, productName);
    if (result.changes > 0) {
      console.log(`Updated: ${productName}`);
      updatedCount++;
    } else {
      console.log(`Not found: ${productName}`);
    }
  }

  console.log(`\nTotal products updated: ${updatedCount}`);
}

updateProductDescriptions();
