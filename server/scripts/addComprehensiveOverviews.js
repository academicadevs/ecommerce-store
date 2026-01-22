import db from '../utils/database.js';

// Comprehensive overview content for each product - matching UPrinting's detailed format
const productOverviews = {
  'Business Flyers': {
    headline: 'Business flyer printing that boosts your brand.',
    quote: "Flyers don't just call a customer's attention—they can easily shift their focus to your school and what it has to offer.",
    content: 'Business flyer printing has been used for decades to inform both current and prospective families about school programs, events, and enrollment opportunities. Promotional flyers are also used to announce major updates such as new programs, enrollment periods, or campus changes. They are easy to hand out in high foot traffic areas, letting you target specific audiences.',
    sections: [
      {
        type: 'intro',
        title: 'How to Choose the Best Paper Type',
        intro: 'We offer three kinds of paper stock and two cardstock options. The choice will depend on your preferred material thickness and the distribution method of the marketing flyers.'
      },
      {
        type: 'comparison-grid',
        title: 'Paper Stock Options',
        columns: [
          {
            name: '70 lb. Paper',
            bullets: [
              'The thinnest paper type, with the same feel and weight as notebook paper.',
              'Recommended for flyers that will travel and land flat on surfaces in high-traffic areas.'
            ]
          },
          {
            name: '80 lb. Paper',
            bullets: [
              'Has the same weight as magazine paper, providing more durability than 70 lb. paper.',
              'The best choice for those who want the flexibility and ease of lightweight paper but with additional durability.'
            ]
          },
          {
            name: '100 lb. Paper',
            bullets: [
              'The thickest paper option available and also known as cover paper.',
              'It has the same thickness as office folder covers, so it feels substantial in your hands.',
              'Best for flyers for special events.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Cardstock Choices',
        columns: [
          {
            name: '10 pt. Cardstock',
            bullets: [
              'Much thicker than paper but still foldable.',
              'This material is normally used for postcards and greeting cards.'
            ]
          },
          {
            name: '14 pt. Cardstock',
            bullets: [
              'Is our thickest and toughest material available.',
              'As weight is currently not an issue distribution method is not an obstacle. Works best for flyers that will be distributed in waiting rooms or in meeting rooms.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Best Use Tips',
        items: [
          'For ultra-smooth flossiness of durability and affordability, go with 14 pt. cardstock. It delivers a professional look with a classic gloss or glossy matte, or uncoated finishes for a natural feel.',
          'Why is my photo color darker or less vibrant when printed? When you have a home printer, screen calibration may not be the same as that on a commercial printer. There is usually a small difference of 10% in color or brightness.',
          'Upload file early. Submit your files in JPEG or other digital formats, while printers use CMYK or final ready files. This will allow you plenty of time to review. A file check of up to 48 hours is typical. Request your editable files early so you are not rushed.',
          'Choose colors carefully. When using multiple colors ensure they look balanced as a preview is not available on a pre-printed template.'
        ]
      },
      {
        type: 'coating-options',
        title: 'What to Expect With Our Coating Options',
        intro: 'Your coating option determines the finish and feel of your business flyer design. Here\'s a quick guide on what to expect from the four available options.',
        options: [
          {
            name: 'Matte',
            description: 'Gives your custom paper prints a non-reflective, even-toned finish.',
            bullets: [
              'Provides a modern look that features sleek designs with simpler text.'
            ]
          },
          {
            name: 'Gloss',
            description: 'Adds that extra pop to your flyer design\'s colors.',
            bullets: [
              'Expect an extra vibrance to the surface that adds that extra sparkle. It conveys the brilliance that comes to magazines.'
            ]
          },
          {
            name: 'High Gloss UV',
            description: 'A shinier-than-glossy and more noticeable reflectivity.',
            bullets: [
              'It\'s able to withstand frequent handling and is resistant to abrasion. Our recommendation: Flyers that will be held, passed, and stored easily.'
            ]
          },
          {
            name: 'Uncoated',
            description: 'Is available for our 70 lb. paper and 14 pt. cardstock.',
            bullets: [
              'Has a toned down ribbon or linen texture that provides a soft surface suitable to write on or use markers.'
            ]
          }
        ]
      },
      {
        type: 'faq',
        title: 'Business Flyer Q&A',
        questions: [
          {
            q: 'What paper weight should I use: glossy or matte finish, coated flyer?',
            a: 'If you want flyers that feel substantial and have a coating, then two cardstock is a the perfect choice. Unlike standard paper, cardstock offers weight, durability, and a premium feel.'
          },
          {
            q: 'Which finish is best for colorful designs?',
            a: 'For flyers with vibrant colors and images, gloss finish will make those colors pop. If your design is more text-heavy or minimalist, matte provides a sophisticated look without glare.'
          },
          {
            q: 'How do I prepare my file for printing?',
            a: 'Ensure your file is in CMYK color mode with 300 DPI resolution. Include a 0.125" bleed on all sides and keep important text at least 0.25" from the trim edge.'
          }
        ]
      }
    ]
  },

  'Event Postcards': {
    headline: 'Custom postcards that deliver your message directly.',
    quote: 'Postcards create a personal connection with families—they arrive directly in their hands with your school\'s message front and center.',
    content: 'Custom postcard printing is a versatile promotional tool that fits every step of your enrollment journey. From acquisition to retention, postcards are a great way to connect with families on a personal level. Studies show direct mail has response rates of 4.25%, significantly higher than digital marketing channels alone.',
    sections: [
      {
        type: 'intro',
        title: 'Choosing the Right Postcard Size',
        intro: 'Different sizes serve different purposes. Consider your message length, mailing requirements, and distribution method when selecting.'
      },
      {
        type: 'comparison-grid',
        title: 'Size Options',
        columns: [
          {
            name: '4" x 6"',
            bullets: [
              'The most affordable and compact option.',
              'Perfect for quick announcements and event reminders.',
              'Can be mailed with a standard postcard stamp.',
              'Easy to include in enrollment packets.'
            ]
          },
          {
            name: '5" x 7"',
            bullets: [
              'Stands out against standard mail.',
              'Great balance between images and copy.',
              'Ideal for open house invitations.',
              'More room for compelling visuals.'
            ]
          },
          {
            name: '6" x 9"',
            bullets: [
              'Large format for maximum impact.',
              'Room for detailed event information.',
              'Eye-catching in any mailbox.',
              'Perfect for enrollment campaigns.'
            ]
          },
          {
            name: '6" x 11"',
            bullets: [
              'EDDM-compatible for Every Door Direct Mail.',
              'Reach entire neighborhoods affordably.',
              'Maximum space for your message.',
              'Ideal for community-wide outreach.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Cardstock Options',
        columns: [
          {
            name: '14 pt. Cardstock Gloss',
            bullets: [
              'Shiny finish that makes colors vibrant.',
              'Professional look and feel.',
              'Durable enough to survive mailing.'
            ]
          },
          {
            name: '14 pt. Cardstock Matte',
            bullets: [
              'Sophisticated, non-reflective finish.',
              'Easy to write on for personalization.',
              'Elegant, professional appearance.'
            ]
          },
          {
            name: '16 pt. Cardstock',
            bullets: [
              'Our thickest, most premium option.',
              'Substantial feel that conveys quality.',
              'Best for high-impact campaigns.'
            ]
          }
        ]
      },
      {
        type: 'coating-options',
        title: 'Coating Options',
        intro: 'The right coating protects your postcards and enhances their appearance.',
        options: [
          {
            name: 'UV Gloss (Front)',
            description: 'High-shine protective coating on the front.',
            bullets: ['Makes colors pop', 'Protects against handling', 'Professional appearance']
          },
          {
            name: 'UV Matte (Front)',
            description: 'Smooth, non-reflective protective coating.',
            bullets: ['Sophisticated look', 'Reduces glare', 'Easy to photograph']
          },
          {
            name: 'No Coating',
            description: 'Natural paper feel on both sides.',
            bullets: ['Easy to write on', 'Classic appearance', 'Budget-friendly option']
          }
        ]
      },
      {
        type: 'tips',
        title: 'Postcard Design Tips',
        items: [
          'Use large, compelling images that draw attention immediately.',
          'Keep your message clear and focused—postcards are scanned in seconds.',
          'Include a strong call-to-action with clear next steps.',
          'Make sure contact information is easy to find.',
          'Use your school colors consistently for brand recognition.'
        ]
      },
      {
        type: 'faq',
        title: 'Postcard Q&A',
        questions: [
          {
            q: 'Can I mail postcards directly?',
            a: 'Yes! All our postcards meet USPS mailing requirements. 4" x 6" can use postcard stamps, while larger sizes require first-class postage.'
          },
          {
            q: 'What\'s EDDM and should I use it?',
            a: 'Every Door Direct Mail (EDDM) lets you send to every address in specific postal routes without needing a mailing list. It\'s perfect for reaching entire neighborhoods around your school.'
          },
          {
            q: 'How should I prepare my images?',
            a: 'Use high-resolution images (300 DPI minimum) in CMYK color mode. Leave 0.125" bleed on all sides for full-bleed designs.'
          }
        ]
      }
    ]
  },

  'Tri-Fold Brochures': {
    headline: 'Professional brochures that tell your complete story.',
    quote: 'A well-designed brochure gives families everything they need to know about your school in one beautiful, portable package.',
    content: 'Brochure printing is part of every successful enrollment campaign. Give away brochures at open houses, highlight details about your programs, or include them with enrollment packets. They are effective, versatile, and affordable promotional tools that showcase your school professionally.',
    sections: [
      {
        type: 'intro',
        title: 'Understanding Fold Options',
        intro: 'Different folds create different reading experiences. Choose based on how you want to present your information and guide the reader through your content.'
      },
      {
        type: 'comparison-grid',
        title: 'Fold Types',
        columns: [
          {
            name: 'Tri-Fold (Letter Fold)',
            bullets: [
              'The most popular choice for brochures.',
              'Six panels that unfold naturally.',
              'Perfect for program overviews.',
              'Fits standard #10 envelopes.',
              'Reader sees cover, then inside spread.'
            ]
          },
          {
            name: 'Z-Fold (Accordion)',
            bullets: [
              'Panels fold in alternating directions.',
              'Creates a storytelling effect.',
              'Each panel reveals the next.',
              'Great for step-by-step information.',
              'Easy to display all panels at once.'
            ]
          },
          {
            name: 'Half-Fold',
            bullets: [
              'Simple four-panel layout.',
              'Large panels for big images.',
              'Works like a small booklet.',
              'Best for simple information.',
              'Easy to design and read.'
            ]
          },
          {
            name: 'Gate Fold',
            bullets: [
              'Two panels open like doors.',
              'Creates a dramatic reveal.',
              'Perfect for hero images.',
              'Premium, impressive feel.',
              'Ideal for special announcements.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Paper Options',
        columns: [
          {
            name: '100 lb. Gloss Text',
            bullets: [
              'Shiny finish for vibrant colors.',
              'Professional magazine-quality feel.',
              'Great for photo-heavy designs.',
              'Folds cleanly without cracking.'
            ]
          },
          {
            name: '100 lb. Matte Text',
            bullets: [
              'Smooth, non-reflective finish.',
              'Easy to read under any lighting.',
              'Sophisticated, modern look.',
              'Perfect for text-heavy content.'
            ]
          },
          {
            name: '80 lb. Uncoated',
            bullets: [
              'Natural paper feel.',
              'Eco-friendly appearance.',
              'Easy to write on.',
              'Budget-friendly option.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Brochure Design Best Practices',
        items: [
          'Plan your content flow before designing—know what goes on each panel.',
          'Keep the cover compelling with a strong headline and image.',
          'Use the back panel for contact information and call-to-action.',
          'Maintain consistent branding with school colors and fonts.',
          'Include plenty of white space—don\'t overcrowd panels.',
          'Use bullet points and short paragraphs for easy scanning.'
        ]
      },
      {
        type: 'faq',
        title: 'Brochure Q&A',
        questions: [
          {
            q: 'What size brochure should I choose?',
            a: '8.5" x 11" (letter size) is the most common and cost-effective. It folds to fit standard envelopes and provides ample space for content.'
          },
          {
            q: 'Do you fold the brochures for me?',
            a: 'Yes! All brochures come professionally scored and folded, ready for distribution.'
          },
          {
            q: 'How do I set up panels correctly?',
            a: 'Download our free templates which show exactly where each panel should be. The roll-in panel on a tri-fold is slightly narrower than the others.'
          }
        ]
      }
    ]
  },

  'Business Cards': {
    headline: 'Premium business cards that make a lasting impression.',
    quote: 'Your business card is often the first tangible piece of your school that families take home—make it memorable.',
    content: 'A quality business card speaks volumes about your school\'s professionalism. From faculty to administrators, everyone benefits from having a card they\'re proud to hand out at open houses, community events, and parent meetings. Premium cardstock and professional finishes ensure your card stands out.',
    sections: [
      {
        type: 'intro',
        title: 'Choosing the Right Cardstock',
        intro: 'The weight and feel of your card communicates quality before anyone reads a word. Here\'s what to expect from each option.'
      },
      {
        type: 'comparison-grid',
        title: 'Cardstock Options',
        columns: [
          {
            name: '14 pt. Cardstock',
            bullets: [
              'Our standard professional option.',
              'Substantial feel without being bulky.',
              'Works with all finish options.',
              'Perfect for most business needs.'
            ]
          },
          {
            name: '16 pt. Cardstock',
            bullets: [
              'Noticeably thicker and sturdier.',
              'Premium feel that impresses.',
              'Extra durability for frequent use.',
              'Best for administrators and leadership.'
            ]
          },
          {
            name: '32 pt. Ultra Thick',
            bullets: [
              'Maximum thickness available.',
              'Luxury feel that stands out.',
              'Makes a bold statement.',
              'Ideal for special occasions.'
            ]
          }
        ]
      },
      {
        type: 'coating-options',
        title: 'Finish Options',
        intro: 'The right finish adds a professional touch, protects your cards, and creates a memorable tactile experience.',
        options: [
          {
            name: 'Gloss UV',
            description: 'High-shine protective finish.',
            bullets: [
              'Makes colors vibrant and punchy.',
              'Protects against fingerprints.',
              'Eye-catching under any lighting.',
              'Classic professional look.'
            ]
          },
          {
            name: 'Matte',
            description: 'Smooth, non-reflective finish.',
            bullets: [
              'Sophisticated, modern appearance.',
              'Easy to write notes on.',
              'No glare for easy reading.',
              'Understated elegance.'
            ]
          },
          {
            name: 'Soft Touch',
            description: 'Velvety, luxurious texture.',
            bullets: [
              'Unique tactile experience.',
              'People remember the feel.',
              'Premium impression.',
              'Fingerprint resistant.'
            ]
          },
          {
            name: 'Spot UV',
            description: 'Glossy accents on matte background.',
            bullets: [
              'Highlights logos and text.',
              'Creates visual depth.',
              'Sophisticated contrast.',
              'Memorable design element.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Business Card Design Tips',
        items: [
          'Keep it clean—include only essential information.',
          'Make sure text is large enough to read easily (minimum 8pt).',
          'Include school logo, name, title, phone, and email at minimum.',
          'Consider adding your school\'s website and social media.',
          'Use the back for additional information or a QR code.',
          'Maintain consistent branding with school colors.'
        ]
      },
      {
        type: 'faq',
        title: 'Business Card Q&A',
        questions: [
          {
            q: 'What\'s the standard business card size?',
            a: '3.5" x 2" is the standard size that fits all card holders and wallets. We also offer square (2" x 2") and other custom sizes.'
          },
          {
            q: 'Can I get rounded corners?',
            a: 'Yes! Rounded corners are available and add a modern touch to your cards. They\'re also more resistant to wear.'
          },
          {
            q: 'How many cards should I order?',
            a: 'We recommend 500 cards per person for the best value. This provides enough for about a year of networking and events.'
          }
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
        type: 'intro',
        title: 'Choosing the Right Poster Size',
        intro: 'Size matters when it comes to posters. Consider viewing distance, display location, and the amount of information you need to include.'
      },
      {
        type: 'comparison-grid',
        title: 'Popular Sizes',
        columns: [
          {
            name: '11" x 17" (Tabloid)',
            bullets: [
              'Compact and versatile.',
              'Perfect for bulletin boards.',
              'Easy to frame and display.',
              'Fits standard frames.',
              'Great for classroom use.'
            ]
          },
          {
            name: '18" x 24"',
            bullets: [
              'Medium format, big impact.',
              'Ideal for hallway displays.',
              'Readable from 10-15 feet.',
              'Common movie poster size.',
              'Works indoors and protected outdoor areas.'
            ]
          },
          {
            name: '24" x 36"',
            bullets: [
              'Large format statement piece.',
              'Commands attention in any space.',
              'Visible from 20+ feet away.',
              'Perfect for lobbies and events.',
              'Our most popular size.'
            ]
          },
          {
            name: '27" x 40"',
            bullets: [
              'Maximum standard size.',
              'Theater poster dimensions.',
              'Impossible to ignore.',
              'Best for major announcements.',
              'Ideal for event promotions.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Paper Options',
        columns: [
          {
            name: '100 lb. Gloss Text',
            bullets: [
              'Shiny finish for vibrant colors.',
              'Makes photos pop.',
              'Affordable for multiple copies.',
              'Best for indoor display.'
            ]
          },
          {
            name: '100 lb. Matte Text',
            bullets: [
              'Non-reflective finish.',
              'Easy to read under lights.',
              'Professional appearance.',
              'Reduces glare in photos.'
            ]
          },
          {
            name: 'Photo Satin',
            bullets: [
              'Professional photo quality.',
              'Subtle sheen without glare.',
              'Rich, deep colors.',
              'Premium presentation.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Poster Design Tips',
        items: [
          'Use high-resolution images (300 DPI) for sharp printing.',
          'Create visual hierarchy—most important info should be largest.',
          'Limit to 2-3 fonts and stay consistent with school branding.',
          'Include a clear call-to-action (date, time, location, or website).',
          'Leave enough white space so the design doesn\'t feel cluttered.',
          'Test readability from the expected viewing distance.'
        ]
      },
      {
        type: 'faq',
        title: 'Poster Q&A',
        questions: [
          {
            q: 'Can I order just one poster?',
            a: 'Absolutely! We have no minimum order. Order one poster or hundreds—whatever you need.'
          },
          {
            q: 'Are posters suitable for outdoor use?',
            a: 'Standard paper posters are best for indoor use. For outdoor display, consider our mounted posters or vinyl banners which are weather-resistant.'
          },
          {
            q: 'What file format should I use?',
            a: 'PDF is preferred for best quality. We also accept JPG, PNG, and AI files. Ensure your file is 300 DPI at actual print size.'
          }
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
        type: 'intro',
        title: 'Understanding Vinyl Materials',
        intro: 'Different vinyl weights offer different benefits. Choose based on where you\'ll display your banner and how long you need it to last.'
      },
      {
        type: 'comparison-grid',
        title: 'Material Options',
        columns: [
          {
            name: '13 oz. Vinyl',
            bullets: [
              'Our standard banner material.',
              'Lasts 3-5 years outdoors.',
              'Great for most applications.',
              'Smooth matte finish.',
              'Cost-effective choice.'
            ]
          },
          {
            name: '18 oz. Heavy Duty Vinyl',
            bullets: [
              'Extra thick and durable.',
              'Lasts up to 5+ years outdoors.',
              'Withstands high winds.',
              'Tear-resistant edges.',
              'Best for permanent signage.'
            ]
          },
          {
            name: 'Mesh Vinyl',
            bullets: [
              'Perforated for wind resistance.',
              'Allows 30% wind pass-through.',
              'Ideal for fences and poles.',
              'Perfect for windy locations.',
              'Won\'t act as a sail.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Finishing Options',
        columns: [
          {
            name: 'Grommets',
            bullets: [
              'Metal rings for rope/hook hanging.',
              'Placed every 2-3 feet.',
              'Easy installation.',
              'Most versatile option.'
            ]
          },
          {
            name: 'Pole Pockets',
            bullets: [
              'Sewn pockets at top/bottom.',
              'Insert poles for hanging.',
              'Clean, professional look.',
              'Great for street banners.'
            ]
          },
          {
            name: 'Hemmed Edges',
            bullets: [
              'Reinforced edges only.',
              'No grommets or pockets.',
              'For frame mounting.',
              'Cleanest appearance.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Banner Design Tips',
        items: [
          'Keep text large and bold—banners are often viewed from a distance.',
          'Use high-contrast colors for maximum readability.',
          'Limit your message to key information only.',
          'Include your school logo prominently.',
          'Add wind slits for very large banners in windy areas.',
          'Consider viewing angle when planning your layout.'
        ]
      },
      {
        type: 'faq',
        title: 'Vinyl Banner Q&A',
        questions: [
          {
            q: 'How do I hang my banner?',
            a: 'Use the grommets with rope, bungee cords, zip ties, or hooks. For pole pockets, slide a dowel or pipe through and hang from brackets.'
          },
          {
            q: 'Can I reuse my banner?',
            a: 'Yes! Vinyl banners can be rolled up and stored for reuse. Store in a cool, dry place and roll (don\'t fold) to prevent creases.'
          },
          {
            q: 'What size banner do I need?',
            a: 'For readable text from 50 feet, letters should be at least 3" tall. A 3\' x 6\' banner works well for most building facades and fences.'
          }
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
        type: 'intro',
        title: 'Choosing the Right Stand',
        intro: 'Different stands offer different features and durability levels. Consider how often you\'ll use it and where it will be displayed.'
      },
      {
        type: 'comparison-grid',
        title: 'Stand Types',
        columns: [
          {
            name: 'Economy Stand',
            bullets: [
              'Budget-friendly option.',
              'Great for occasional use.',
              'Lightweight aluminum frame.',
              'Basic carrying case included.',
              'Perfect for single events.'
            ]
          },
          {
            name: 'Standard Stand',
            bullets: [
              'Best value for regular use.',
              'Durable construction.',
              'Smooth retraction mechanism.',
              'Padded carrying case.',
              'Our most popular choice.'
            ]
          },
          {
            name: 'Premium Stand',
            bullets: [
              'Heavy-duty for frequent use.',
              'Wider base for stability.',
              'Swappable graphic cassettes.',
              'Premium carrying case.',
              'Best for high-traffic areas.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Size Options',
        columns: [
          {
            name: '33" x 81"',
            bullets: [
              'Standard size for most needs.',
              'Compact footprint.',
              'Easy to transport.',
              'Works in tight spaces.'
            ]
          },
          {
            name: '36" x 92"',
            bullets: [
              'Slightly wider and taller.',
              'More visibility.',
              'Still easy to carry.',
              'Better for lobbies.'
            ]
          },
          {
            name: '47" x 81"',
            bullets: [
              'Extra wide format.',
              'Maximum visual impact.',
              'Great for trade shows.',
              'Requires more floor space.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Retractable Banner Tips',
        items: [
          'Always retract slowly and evenly to protect the mechanism.',
          'Store in the carrying case when not in use.',
          'Don\'t fold the banner—always roll it into the base.',
          'Place away from high-traffic walking paths to prevent tipping.',
          'Consider using two or more for a backdrop effect.',
          'Update graphics seasonally to keep content fresh.'
        ]
      },
      {
        type: 'faq',
        title: 'Retractable Banner Q&A',
        questions: [
          {
            q: 'Can I replace just the graphic?',
            a: 'Yes! Our premium stands have replaceable cassettes. For other stands, we can print replacement graphics that you install yourself.'
          },
          {
            q: 'How long do retractable banners last?',
            a: 'With proper care, the stand lasts for years. Graphics typically look great for 1-3 years of regular use depending on conditions.'
          },
          {
            q: 'Are they stable enough for outdoor use?',
            a: 'Retractable banners are designed for indoor use. For outdoor events, use them in protected areas or weight the base. We recommend vinyl banners for outdoor applications.'
          }
        ]
      }
    ]
  },

  'Yard Signs': {
    headline: 'Weatherproof yard signs that get your message noticed.',
    quote: 'Strategically placed yard signs turn every corner of your community into an advertisement for your school.',
    content: 'Yard signs are versatile, cost-effective tools for promoting enrollment, events, and campus directions. Made of durable corrugated plastic that withstands outdoor conditions, they stay readable even after exposure to rain and wind. Lightweight and portable, they can be installed anywhere with the included metal stakes.',
    sections: [
      {
        type: 'intro',
        title: 'Understanding Corrugated Plastic',
        intro: 'Our yard signs are made from 4mm corrugated plastic (also called coroplast), a weather-resistant material that\'s both durable and lightweight.'
      },
      {
        type: 'comparison-grid',
        title: 'Size Options',
        columns: [
          {
            name: '12" x 18"',
            bullets: [
              'Compact and economical.',
              'Perfect for directional arrows.',
              'Easy to place anywhere.',
              'Works in smaller yards.',
              'Best for short messages.'
            ]
          },
          {
            name: '18" x 24"',
            bullets: [
              'Our most popular size.',
              'Visible from the street.',
              'Room for logo and message.',
              'Standard H-stake compatible.',
              'Great for enrollment season.'
            ]
          },
          {
            name: '24" x 36"',
            bullets: [
              'Maximum visibility.',
              'Readable from moving cars.',
              'Large logo placement.',
              'Best for high-traffic areas.',
              'Makes a big statement.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Display Options',
        columns: [
          {
            name: 'H-Stakes (Standard)',
            bullets: [
              'Metal wire stakes.',
              'Easy ground installation.',
              'Works in most soil types.',
              'Included with purchase.'
            ]
          },
          {
            name: 'Spider Stakes',
            bullets: [
              'More secure than H-stakes.',
              'Better for hard ground.',
              'Distributes wind load.',
              'Upgrade option available.'
            ]
          },
          {
            name: 'Grommets',
            bullets: [
              'For fence or wall mounting.',
              'Metal rings at corners.',
              'Tie with zip ties or rope.',
              'No stakes needed.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Yard Sign Best Practices',
        items: [
          'Keep text large—viewers have only seconds to read while passing.',
          'Limit to 5-7 words maximum for roadside visibility.',
          'Use high-contrast colors (dark text on light background or vice versa).',
          'Include your school name/logo for brand recognition.',
          'Place at eye level and perpendicular to traffic.',
          'Check local regulations before placing on public property.'
        ]
      },
      {
        type: 'faq',
        title: 'Yard Sign Q&A',
        questions: [
          {
            q: 'How long will yard signs last outside?',
            a: 'Our corrugated plastic signs typically last 1-2 years in normal outdoor conditions. UV-resistant inks help maintain color vibrancy.'
          },
          {
            q: 'Can I get custom shapes?',
            a: 'Yes! We offer standard shapes plus custom die-cutting for unique shapes like arrows, houses, and more.'
          },
          {
            q: 'Should I get single or double-sided?',
            a: 'Double-sided is recommended for most applications so your message is visible from both directions.'
          }
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
        type: 'intro',
        title: 'A-Frame Sign Benefits',
        intro: 'A-frame signs (also called sandwich boards) are portable, versatile, and instantly noticeable. They\'re perfect for guiding visitors and highlighting information.'
      },
      {
        type: 'comparison-grid',
        title: 'Size Options',
        columns: [
          {
            name: '24" x 36"',
            bullets: [
              'Standard sidewalk size.',
              'Easy to move and store.',
              'Fits through doorways.',
              'Good for most locations.',
              'Clear visibility at eye level.'
            ]
          },
          {
            name: '27" x 46"',
            bullets: [
              'Larger format for more content.',
              'Greater visibility from distance.',
              'Better for spacious areas.',
              'More room for details.',
              'Commands attention.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Common Uses',
        columns: [
          {
            name: 'Entrance Signage',
            bullets: [
              'Welcome visitors.',
              'Direct to main office.',
              'Display school name.',
              'Show visitor parking.'
            ]
          },
          {
            name: 'Event Wayfinding',
            bullets: [
              'Guide open house guests.',
              'Mark registration areas.',
              'Point to activities.',
              'Direct traffic flow.'
            ]
          },
          {
            name: 'Daily Messaging',
            bullets: [
              'Share announcements.',
              'Display quotes.',
              'Promote events.',
              'Celebrate achievements.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'A-Frame Sign Tips',
        items: [
          'Place where foot traffic is highest for maximum visibility.',
          'Change messages regularly to keep content fresh and relevant.',
          'Use both sides—they\'re visible from different directions.',
          'Secure properly in windy conditions to prevent tipping.',
          'Store indoors when not in use to extend lifespan.',
          'Keep the area around the sign clear for easy reading.'
        ]
      },
      {
        type: 'faq',
        title: 'A-Frame Sign Q&A',
        questions: [
          {
            q: 'Can I change the graphics myself?',
            a: 'Yes! Our A-frames have slide-in graphic panels that are easy to swap out whenever you want to update your message.'
          },
          {
            q: 'Are they suitable for outdoor use?',
            a: 'Yes, our A-frames are weather-resistant. However, we recommend bringing them inside during severe weather or high winds.'
          },
          {
            q: 'How do I secure them in wind?',
            a: 'Most A-frames have a weighted base or feet. For extra stability, you can add sandbags or weight bags at the base.'
          }
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
        type: 'intro',
        title: 'Understanding Booklet Binding',
        intro: 'The binding method affects both the look and functionality of your booklet. Choose based on page count and how the booklet will be used.'
      },
      {
        type: 'comparison-grid',
        title: 'Binding Options',
        columns: [
          {
            name: 'Saddle-Stitch',
            bullets: [
              'Stapled at the spine fold.',
              'Lies flat when open.',
              'Best for up to 64 pages.',
              'Most affordable option.',
              'Clean, professional look.'
            ]
          },
          {
            name: 'Perfect Binding',
            bullets: [
              'Glued spine like paperbacks.',
              'Professional book appearance.',
              'Best for 48+ pages.',
              'Flat spine for title printing.',
              'Premium presentation.'
            ]
          },
          {
            name: 'Wire-O Binding',
            bullets: [
              'Metal wire spiral.',
              'Opens completely flat.',
              'Pages can fold back.',
              'Great for reference guides.',
              'Durable for frequent use.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Page Count Options',
        columns: [
          {
            name: '8 Pages',
            bullets: [
              'Quick overview format.',
              'Program highlights.',
              'Key information only.',
              'Budget-friendly.'
            ]
          },
          {
            name: '12-16 Pages',
            bullets: [
              'Standard enrollment guide.',
              'Room for programs and staff.',
              'FAQ section.',
              'Most popular choice.'
            ]
          },
          {
            name: '20-24 Pages',
            bullets: [
              'Comprehensive coverage.',
              'All programs detailed.',
              'Photos throughout.',
              'Complete resource.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Enrollment Guide Best Practices',
        items: [
          'Start with an engaging cover that reflects your school\'s personality.',
          'Include a table of contents for easy navigation.',
          'Use plenty of photos showing real students and activities.',
          'Organize content logically—programs, staff, facilities, FAQ.',
          'Include clear contact information and next steps.',
          'End with a strong call-to-action for enrollment.'
        ]
      },
      {
        type: 'faq',
        title: 'Booklet Q&A',
        questions: [
          {
            q: 'What page counts are available?',
            a: 'Saddle-stitch booklets must have page counts in multiples of 4 (8, 12, 16, 20, etc.). We offer options from 8 to 64 pages.'
          },
          {
            q: 'Can I have different paper for the cover?',
            a: 'Yes! Choose "self-cover" for the same paper throughout, or upgrade to a heavier cover stock for a more substantial feel.'
          },
          {
            q: 'How should I set up my file?',
            a: 'Provide pages in reader spreads (sequential order). Our templates show exact layout requirements including bleeds and margins.'
          }
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
        type: 'intro',
        title: 'Choosing the Right Folder',
        intro: 'Different folder styles serve different needs. Consider what materials you\'ll include and how the folder will be used.'
      },
      {
        type: 'comparison-grid',
        title: 'Size Options',
        columns: [
          {
            name: '4" x 9"',
            bullets: [
              'Compact format.',
              'Fits #10 envelopes.',
              'Great for brochures.',
              'Easy to mail.'
            ]
          },
          {
            name: '9" x 12"',
            bullets: [
              'Standard letter size.',
              'Holds 8.5" x 11" sheets.',
              'Most popular choice.',
              'Professional appearance.'
            ]
          },
          {
            name: '9" x 14.5"',
            bullets: [
              'Legal size capacity.',
              'Extra tall for documents.',
              'Stands out from others.',
              'More pocket space.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Pocket Styles',
        columns: [
          {
            name: 'Standard Two-Pocket',
            bullets: [
              'Classic configuration.',
              'Pockets on left and right.',
              'Organize by category.',
              'Most versatile option.'
            ]
          },
          {
            name: 'Reinforced Tab',
            bullets: [
              'Extra durability.',
              'Tabbed for filing.',
              'Heavy-duty use.',
              'Long-lasting.'
            ]
          },
          {
            name: 'Business Card Slots',
            bullets: [
              'Built-in card holders.',
              'Right and/or left pockets.',
              'Professional touch.',
              'Easy contact access.'
            ]
          }
        ]
      },
      {
        type: 'coating-options',
        title: 'Finish Options',
        intro: 'The right finish protects your folders and enhances their appearance and feel.',
        options: [
          {
            name: 'Gloss',
            description: 'Shiny, reflective finish.',
            bullets: ['Vibrant colors', 'Professional look', 'Some fingerprints']
          },
          {
            name: 'Matte',
            description: 'Smooth, non-reflective finish.',
            bullets: ['Sophisticated', 'Easy to write on', 'Fingerprint resistant']
          },
          {
            name: 'Soft Touch',
            description: 'Velvety, luxurious texture.',
            bullets: ['Premium feel', 'Memorable impression', 'Scuff resistant']
          }
        ]
      },
      {
        type: 'tips',
        title: 'Folder Content Tips',
        items: [
          'Include an enrollment guide or brochure in one pocket.',
          'Add application forms and checklists in the other pocket.',
          'Insert staff business cards in the card slots.',
          'Add a personalized welcome letter on top.',
          'Include a school calendar and important dates.',
          'Don\'t overstuff—pockets hold about 25 sheets each.'
        ]
      },
      {
        type: 'faq',
        title: 'Folder Q&A',
        questions: [
          {
            q: 'What cardstock weight is used?',
            a: 'Our folders are printed on sturdy 14pt or 16pt cardstock, thick enough to feel substantial and protect your documents.'
          },
          {
            q: 'Can I print inside the pockets?',
            a: 'Yes! The inside panels and pockets can be printed, which is great for adding additional information or reinforcing your branding.'
          },
          {
            q: 'How do I set up the artwork?',
            a: 'Download our free templates that show exact pocket placement, fold lines, and bleed requirements for accurate setup.'
          }
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
        type: 'intro',
        title: 'Understanding Table Cover Styles',
        intro: 'Different styles offer different benefits. Consider your typical setup needs and how you\'ll use the cover.'
      },
      {
        type: 'comparison-grid',
        title: 'Style Options',
        columns: [
          {
            name: 'Fitted (4-Sided)',
            bullets: [
              'Complete coverage all sides.',
              'Sleek, tailored appearance.',
              'Leg pockets keep it secure.',
              'Clean look from any angle.',
              'Best for formal events.'
            ]
          },
          {
            name: '3-Sided Open Back',
            bullets: [
              'Front, sides, and top covered.',
              'Open back for storage access.',
              'Reach supplies easily.',
              'Seating behind table.',
              'Most practical for events.'
            ]
          },
          {
            name: 'Throw Style',
            bullets: [
              'Draped over the table.',
              'Easy to put on and adjust.',
              'Casual, elegant look.',
              'Works on various table sizes.',
              'Most versatile option.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Table Sizes',
        columns: [
          {
            name: '6ft Table',
            bullets: [
              'Standard folding table size.',
              'Fits most indoor venues.',
              'Easy to transport.',
              'Works for 2-3 people behind.',
              'Most common choice.'
            ]
          },
          {
            name: '8ft Table',
            bullets: [
              'Larger display area.',
              'More room for materials.',
              'Seats 3-4 people.',
              'Better for trade shows.',
              'More visual impact.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Table Cover Tips',
        items: [
          'Iron or steam out wrinkles before events (use low heat).',
          'Machine wash cold with mild detergent for cleaning.',
          'Roll (don\'t fold) for storage to prevent creases.',
          'Pair with a matching retractable banner for a cohesive look.',
          'Consider a table runner for a layered appearance.',
          'Keep an extra cover on hand for back-to-back events.'
        ]
      },
      {
        type: 'faq',
        title: 'Table Cover Q&A',
        questions: [
          {
            q: 'How long will my table cover last?',
            a: 'With proper care, table covers last 3-5 years. The dye-sublimation printing won\'t fade, peel, or crack.'
          },
          {
            q: 'Can I machine wash the cover?',
            a: 'Yes! Wash on cold with mild detergent. Air dry or tumble dry on low. No bleach or fabric softeners.'
          },
          {
            q: 'Will it fit different table brands?',
            a: 'Our covers are sized for standard 6ft (72" x 30" x 29") and 8ft (96" x 30" x 29") folding tables and will fit most brands.'
          }
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
        type: 'intro',
        title: 'Choosing the Right Backdrop',
        intro: 'Different backdrop styles work better for different events. Consider your primary use case, space constraints, and setup time.'
      },
      {
        type: 'comparison-grid',
        title: 'Style Options',
        columns: [
          {
            name: 'Fabric Pop-Up',
            bullets: [
              'Collapsible frame design.',
              'Sets up in minutes.',
              'Lightweight and portable.',
              'Great for frequent events.',
              'Most affordable option.'
            ]
          },
          {
            name: 'Tension Fabric',
            bullets: [
              'Sleek, modern appearance.',
              'Seamless graphics.',
              'Pillowcase-style graphic.',
              'Premium, wrinkle-free look.',
              'Best for permanent displays.'
            ]
          },
          {
            name: 'Step and Repeat',
            bullets: [
              'Repeating logo pattern.',
              'Classic media wall style.',
              'Perfect for photos.',
              'Logos visible at any crop.',
              'Professional event staple.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Size Options',
        columns: [
          {
            name: '8ft x 8ft',
            bullets: [
              'Compact backdrop.',
              'Fits smaller spaces.',
              'Good for 2-3 people photos.',
              'Easy to transport.',
              'Most portable option.'
            ]
          },
          {
            name: '8ft x 10ft',
            bullets: [
              'Standard event size.',
              'Works for groups.',
              'Good visibility.',
              'Versatile dimensions.',
              'Popular choice.'
            ]
          },
          {
            name: '10ft x 10ft',
            bullets: [
              'Maximum impact.',
              'Large group photos.',
              'Trade show presence.',
              'Impressive scale.',
              'Best for big events.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Backdrop Tips',
        items: [
          'Position 4-6 feet from the camera for best photo depth.',
          'Use proper lighting to avoid harsh shadows on faces.',
          'Keep 2-3 feet of space between subjects and backdrop.',
          'For step-and-repeat, ensure logos are visible at head height.',
          'Practice setup before your event to know timing.',
          'Store flat or rolled in the carrying case when not in use.'
        ]
      },
      {
        type: 'faq',
        title: 'Backdrop Q&A',
        questions: [
          {
            q: 'How long does setup take?',
            a: 'Pop-up frames take about 5-10 minutes to set up. Tension fabric frames may take 10-15 minutes. No tools required for either.'
          },
          {
            q: 'Can I replace just the graphic?',
            a: 'Yes! We sell replacement graphics for all our frames, so you can update your design without buying a new frame.'
          },
          {
            q: 'Is the graphic machine washable?',
            a: 'Yes, fabric graphics can be machine washed on gentle cycle with cold water. Air dry to prevent shrinkage.'
          }
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
        type: 'intro',
        title: 'Understanding Flag Options',
        intro: 'Feather flags come in various sizes and configurations. Choose based on your display location and visibility needs.'
      },
      {
        type: 'comparison-grid',
        title: 'Size Options',
        columns: [
          {
            name: '8ft Flag',
            bullets: [
              'Compact size.',
              'Great for indoor use.',
              'Fits under ceilings.',
              'Easy to transport.',
              'Subtle presence.'
            ]
          },
          {
            name: '10ft Flag',
            bullets: [
              'Medium visibility.',
              'Works indoor/outdoor.',
              'Good street presence.',
              'Popular choice.',
              'Balanced size.'
            ]
          },
          {
            name: '12ft Flag',
            bullets: [
              'High visibility.',
              'Stands out from distance.',
              'Great for entrances.',
              'Eye-catching height.',
              'Strong presence.'
            ]
          },
          {
            name: '15ft Flag',
            bullets: [
              'Maximum height.',
              'Visible from far away.',
              'Impressive display.',
              'Large events.',
              'Makes a statement.'
            ]
          }
        ]
      },
      {
        type: 'comparison-grid',
        title: 'Base Options',
        columns: [
          {
            name: 'Ground Stake',
            bullets: [
              'Steel spike for grass.',
              'Quick installation.',
              'Very stable.',
              'Best for lawns.',
              'Included with flag.'
            ]
          },
          {
            name: 'Cross Base',
            bullets: [
              'X-shaped floor stand.',
              'For hard surfaces.',
              'Indoor events.',
              'Portable option.',
              'Compact storage.'
            ]
          },
          {
            name: 'Water Base',
            bullets: [
              'Weighted base.',
              'Fill with water/sand.',
              'Outdoor hard surfaces.',
              'Maximum stability.',
              'Best for wind.'
            ]
          }
        ]
      },
      {
        type: 'tips',
        title: 'Feather Flag Tips',
        items: [
          'Use single-sided printing for budget, double-sided for best visibility.',
          'Place flags in pairs at entrances for maximum impact.',
          'Bring flags indoors during severe weather to extend lifespan.',
          'Check that flag can rotate freely—don\'t let it wrap around pole.',
          'Store dry to prevent mildew—wash if stored damp.',
          'Replace pole sections if they become bent or damaged.'
        ]
      },
      {
        type: 'faq',
        title: 'Feather Flag Q&A',
        questions: [
          {
            q: 'Single or double-sided printing?',
            a: 'Single-sided shows a mirror image on the reverse. Double-sided has a blocker layer for two distinct, non-mirrored sides—best for text-heavy designs.'
          },
          {
            q: 'Can I wash my feather flag?',
            a: 'Yes! Machine wash cold on gentle cycle or hand wash. Air dry completely before storing to prevent mildew.'
          },
          {
            q: 'How do I set up my feather flag?',
            a: 'Connect the pole sections, slide the flag sleeve onto the pole, secure the pole in your chosen base. Total setup time: about 5 minutes.'
          }
        ]
      }
    ]
  }
};

// Ensure overview column exists
function ensureOverviewColumn() {
  try {
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

// Update products with comprehensive overview content
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
      console.log(`Updated comprehensive overview: ${productName}`);
      updatedCount++;
    } else {
      console.log(`Not found: ${productName}`);
    }
  }

  console.log(`\nTotal products updated with comprehensive overviews: ${updatedCount}`);
}

updateProductOverviews();
