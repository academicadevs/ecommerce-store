import db from '../utils/database.js';

// Overview content for each product - based on UPrinting style
const productOverviews = {
  'Business Flyers': {
    headline: 'Business flyer printing that boosts your brand.',
    quote: "Flyers don't just call a customer's attention—they can easily shift their focus to your school and what it has to offer.",
    content: 'Business flyer printing has been used for decades to inform both current and prospective families about school programs and events. Promotional flyers are also used to announce major updates such as new programs, enrollment periods, or campus changes. They are easy to hand out at community events, letting you target specific audiences.',
    sections: [
      {
        title: 'How to Choose the Best Paper Type',
        intro: 'We offer three kinds of paper stock and cardstock options. The choice will depend on your preferred material thickness and distribution method.',
        items: [
          { name: '100 lb. Gloss', description: 'Shiny finish that makes colors pop. Great for eye-catching promotional materials.' },
          { name: '100 lb. Matte', description: 'Smooth, non-reflective finish. Easy to write on and professional looking.' },
          { name: '80 lb. Uncoated', description: 'Natural paper feel. Ideal for a more traditional, eco-friendly look.' },
          { name: '14pt Cardstock', description: 'Thick and durable. Perfect for flyers that need to stand out and last.' }
        ]
      }
    ]
  },
  'Event Postcards': {
    headline: 'Custom postcards that deliver your message.',
    quote: 'Postcards create a personal connection with families—they arrive directly in their hands with your school\'s message front and center.',
    content: 'Custom postcard printing is a versatile promotional tool that fits every step of your enrollment journey. From acquisition to retention, postcards are a great way to connect with families on a personal level. Studies show direct mail has higher response rates than digital marketing alone.',
    sections: [
      {
        title: 'Choosing the Right Postcard Size',
        intro: 'Different sizes serve different purposes. Choose based on your message length and mailing requirements.',
        items: [
          { name: '4" x 6"', description: 'Compact and cost-effective. Perfect for quick announcements and can be mailed with a standard postcard stamp.' },
          { name: '5" x 7"', description: 'Stands out in the mailbox. Great balance between images and compelling copy.' },
          { name: '6" x 9"', description: 'Large format for maximum impact. Ideal for detailed event information.' },
          { name: '6" x 11"', description: 'EDDM-compatible for Every Door Direct Mail campaigns to entire neighborhoods.' }
        ]
      }
    ]
  },
  'Tri-Fold Brochures': {
    headline: 'Professional brochures that tell your story.',
    quote: 'A well-designed brochure gives families everything they need to know about your school in one beautiful, portable package.',
    content: 'Brochure printing is part of every successful enrollment campaign. Give away brochures at open houses, highlight details about your programs, or include them with every enrollment packet. They are effective, versatile, and affordable promotional tools that showcase your school professionally.',
    sections: [
      {
        title: 'Fold Options for Every Need',
        intro: 'Different folds create different reading experiences. Choose based on how you want to present your information.',
        items: [
          { name: 'Tri-Fold', description: 'The most popular choice. Six panels that unfold naturally, perfect for program overviews.' },
          { name: 'Half-Fold', description: 'Simple four-panel layout. Great for menus, price lists, or simple information.' },
          { name: 'Z-Fold', description: 'Accordion-style fold. Each panel reveals the next, creating a storytelling effect.' },
          { name: 'Gate Fold', description: 'Two panels open like doors. Creates a dramatic reveal for your main message.' }
        ]
      }
    ]
  },
  'Business Cards': {
    headline: 'Premium business cards that make an impression.',
    quote: 'Your business card is often the first tangible piece of your school that families take home—make it memorable.',
    content: 'A quality business card speaks volumes about your school\'s professionalism. From faculty to administrators, everyone benefits from having a card they\'re proud to hand out. Premium cardstock and professional finishes ensure your card stands out from the rest.',
    sections: [
      {
        title: 'Finish Options',
        intro: 'The right finish adds a professional touch and protects your cards from wear.',
        items: [
          { name: 'Gloss UV', description: 'High-shine finish that makes colors vibrant and protects against fingerprints.' },
          { name: 'Matte', description: 'Sophisticated, non-reflective finish. Easy to write on for adding notes.' },
          { name: 'Soft Touch', description: 'Velvety texture that feels luxurious. Creates a memorable tactile experience.' },
          { name: 'Spot UV', description: 'Glossy accents on a matte background. Highlights logos and key elements.' }
        ]
      }
    ]
  },
  'Event Posters': {
    headline: 'Large format posters that demand attention.',
    quote: 'A striking poster in the right location can reach hundreds of families every day—it\'s advertising that works around the clock.',
    content: 'Large format posters showcase your school at events, in hallways, and on community boards. High-quality printing brings out vibrant colors and sharp details that capture attention from across the room. Perfect for promoting events, celebrating achievements, and sharing important announcements.',
    sections: [
      {
        title: 'Popular Poster Sizes',
        intro: 'Choose the right size based on viewing distance and display location.',
        items: [
          { name: '11" x 17"', description: 'Compact size perfect for bulletin boards and classroom displays.' },
          { name: '18" x 24"', description: 'Medium format ideal for hallways and indoor common areas.' },
          { name: '24" x 36"', description: 'Large format that commands attention. Great for events and lobbies.' },
          { name: '27" x 40"', description: 'Movie poster size. Maximum impact for major announcements.' }
        ]
      }
    ]
  },
  'Vinyl Banners': {
    headline: 'Durable vinyl banners built to last outdoors.',
    quote: 'Whether rain or shine, your message stays bold and vibrant—vinyl banners are the workhorses of outdoor advertising.',
    content: 'Vinyl banners are made of durable, weather-resistant material that withstands rain, wind, and sun exposure. Your message stays readable and colors stay vibrant even after months of outdoor display. Perfect for enrollment season, campus events, and permanent outdoor signage.',
    sections: [
      {
        title: 'Material Options',
        intro: 'Choose the right material based on where and how long you\'ll display your banner.',
        items: [
          { name: '13oz Vinyl', description: 'Standard weight for most applications. Lasts 3-5 years outdoors with proper care.' },
          { name: '18oz Heavy Duty', description: 'Extra thick and durable. Built for high-traffic areas and long-term display.' },
          { name: 'Mesh Vinyl', description: 'Perforated for wind resistance. Ideal for fences and windy locations.' }
        ]
      }
    ]
  },
  'Retractable Banner Stands': {
    headline: 'Professional displays that set up in seconds.',
    quote: 'From packed away to picture-perfect in under a minute—retractable banners make every event setup effortless.',
    content: 'Retractable banners help you stand out at open houses, conferences, and community events. These portable displays capture attention with bright graphics on a tall, sturdy frame. The retractable design means setup takes seconds, and the included carrying case makes transport easy.',
    sections: [
      {
        title: 'Stand Types',
        intro: 'Different stands offer different features. Choose based on your usage and budget.',
        items: [
          { name: 'Economy', description: 'Budget-friendly option for occasional use. Lightweight and portable.' },
          { name: 'Standard', description: 'Best value for regular use. Durable construction with smooth retraction.' },
          { name: 'Premium', description: 'Wider base for maximum stability. Ideal for high-traffic areas and permanent displays.' }
        ]
      }
    ]
  },
  'Yard Signs': {
    headline: 'Weatherproof yard signs that get noticed.',
    quote: 'Strategically placed yard signs turn every corner of your community into an advertisement for your school.',
    content: 'Yard signs are versatile, cost-effective tools for promoting enrollment, events, and campus directions. Made of durable corrugated plastic that withstands outdoor conditions, they stay readable even after exposure to rain and wind. Lightweight and portable, they can be installed anywhere with the included metal stakes.',
    sections: [
      {
        title: 'Size Guide',
        intro: 'Bigger isn\'t always better. Choose based on viewing distance and message length.',
        items: [
          { name: '12" x 18"', description: 'Compact size ideal for directional signage and smaller announcements.' },
          { name: '18" x 24"', description: 'Most popular size. Great balance of visibility and portability.' },
          { name: '24" x 36"', description: 'Large format for maximum visibility from the road. Perfect for enrollment campaigns.' }
        ]
      }
    ]
  },
  'A-Frame Signs': {
    headline: 'Sidewalk signs that guide and inform.',
    quote: 'Position your message exactly where families will see it—A-frame signs put your school front and center.',
    content: 'Double-sided A-frame signs are perfect for entrances, events, and directional signage. The sturdy frame folds flat for easy storage and transport. Weather-resistant construction with replaceable graphic inserts means you can update your message anytime without buying a new sign.',
    sections: [
      {
        title: 'Display Options',
        intro: 'A-frames work in various settings. Consider where you\'ll use yours most.',
        items: [
          { name: 'Entrance Display', description: 'Welcome visitors and direct them to the right location.' },
          { name: 'Event Signage', description: 'Guide attendees at open houses, orientations, and school events.' },
          { name: 'Daily Messaging', description: 'Share rotating announcements, quotes, or upcoming events.' }
        ]
      }
    ]
  },
  'Enrollment Guides': {
    headline: 'Comprehensive booklets that inform and inspire.',
    quote: 'Give families a complete picture of your school—enrollment guides answer questions before they\'re even asked.',
    content: 'Custom booklets serve as versatile tools for showcasing your programs, creating detailed enrollment guides, and providing comprehensive information to families. Saddle-stitch binding creates a professional, neat appearance that lies flat for easy reading. Perfect for enrollment packets, program guides, and welcome materials.',
    sections: [
      {
        title: 'Page Count Options',
        intro: 'More pages mean more information, but keep it focused. Quality over quantity.',
        items: [
          { name: '8 Pages', description: 'Quick overview format. Perfect for program highlights and key information.' },
          { name: '12 Pages', description: 'Standard enrollment guide. Room for programs, staff, and FAQ.' },
          { name: '16-20 Pages', description: 'Comprehensive guide with detailed information about all aspects of your school.' },
          { name: '24 Pages', description: 'Complete resource. Include everything families need to make their decision.' }
        ]
      }
    ]
  },
  'Presentation Folders': {
    headline: 'Professional folders that organize and impress.',
    quote: 'First impressions matter—a quality presentation folder shows families you care about every detail.',
    content: 'Pocket folders are versatile, classic tools perfect for enrollment packets, welcome materials, and administrative documents. Whether delivering information at open houses, parent meetings, or orientation events, these folders give off a polished, professional image every time.',
    sections: [
      {
        title: 'Pocket Styles',
        intro: 'Different pocket configurations serve different needs. Choose based on your typical contents.',
        items: [
          { name: 'Standard 2-Pocket', description: 'Classic design with pockets on both sides. Holds multiple documents securely.' },
          { name: 'Reinforced Tab', description: 'Extra durability for heavy use. Great for materials that will be referenced often.' },
          { name: 'Business Card Slots', description: 'Built-in slots for business cards. Perfect for enrollment packets with staff contacts.' }
        ]
      }
    ]
  },
  'Table Covers': {
    headline: 'Custom table covers that transform your display.',
    quote: 'Turn any folding table into a branded booth—table covers make your school look professional anywhere.',
    content: 'Transform any table into a branded display with custom stretch table covers. Made of durable, stain-resistant polyester fabric with vibrant dye-sublimation printing. The stretch design fits snugly over standard folding tables, removing wrinkles for a professional look at every event.',
    sections: [
      {
        title: 'Style Options',
        intro: 'Different styles offer different benefits. Consider your typical setup needs.',
        items: [
          { name: 'Fitted (4-Sided)', description: 'Complete coverage on all sides. Clean, professional look for any setting.' },
          { name: '3-Sided Open Back', description: 'Access to storage under the table. Great for events where you need supplies handy.' },
          { name: 'Throw Style', description: 'Draped over the table. Easy to put on and adjust, casual yet branded look.' }
        ]
      }
    ]
  },
  'Backdrop Displays': {
    headline: 'Large format backdrops that make an impact.',
    quote: 'Create the perfect photo opportunity—branded backdrops turn every event into a shareable moment.',
    content: 'Make a big impact at events with large format backdrop displays. Perfect for photo opportunities, presentations, and major announcements. The portable frame sets up in minutes and includes a carrying case for easy transport. Wrinkle-free fabric graphics create a professional backdrop for any occasion.',
    sections: [
      {
        title: 'Backdrop Styles',
        intro: 'Different styles work better for different events. Consider your primary use case.',
        items: [
          { name: 'Fabric Pop-Up', description: 'Lightweight and easy to set up. Great for regular events and travel.' },
          { name: 'Tension Fabric', description: 'Sleek, modern look with seamless graphics. Premium option for permanent displays.' },
          { name: 'Step and Repeat', description: 'Repeating logo pattern. Perfect for photo opportunities and media events.' }
        ]
      }
    ]
  },
  'Feather Flags': {
    headline: 'Eye-catching flags that flutter and attract.',
    quote: 'Movement catches the eye—feather flags wave hello to every family that passes by.',
    content: 'Eye-catching feather flags attract attention at outdoor events, open houses, and campus entrances. The flutter motion naturally draws the eye, making them impossible to ignore. Made from durable, washable polyester fabric suitable for both indoor and outdoor use.',
    sections: [
      {
        title: 'Base Options',
        intro: 'The right base keeps your flag standing tall. Choose based on your display surface.',
        items: [
          { name: 'Ground Stake', description: 'Steel spike for grass and soft ground. Quick to install and very stable.' },
          { name: 'Cross Base (Indoor)', description: 'X-shaped base for hard surfaces. Perfect for lobbies and indoor events.' },
          { name: 'Water Base', description: 'Weighted base for outdoor hard surfaces. Fill with water or sand for stability.' }
        ]
      }
    ]
  }
};

// First, check if overview column exists, if not add it
function ensureOverviewColumn() {
  try {
    // Check if column exists
    const tableInfo = db.prepare("PRAGMA table_info(products)").all();
    const hasOverview = tableInfo.some(col => col.name === 'overview');

    if (!hasOverview) {
      db.exec('ALTER TABLE products ADD COLUMN overview TEXT');
      console.log('Added overview column to products table');
    }
  } catch (error) {
    console.error('Error checking/adding column:', error);
  }
}

// Update products with overview content
function updateProductOverviews() {
  ensureOverviewColumn();

  const updateStmt = db.prepare(`
    UPDATE products
    SET overview = ?, updatedAt = ?
    WHERE name = ?
  `);

  const now = new Date().toISOString();
  let updatedCount = 0;

  for (const [productName, data] of Object.entries(productOverviews)) {
    const overviewJson = JSON.stringify(data);
    const result = updateStmt.run(overviewJson, now, productName);
    if (result.changes > 0) {
      console.log(`Updated overview: ${productName}`);
      updatedCount++;
    } else {
      console.log(`Not found: ${productName}`);
    }
  }

  console.log(`\nTotal products updated with overviews: ${updatedCount}`);
}

updateProductOverviews();
