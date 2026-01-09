import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

// Get dummy users
const users = db.prepare(`
  SELECT id, email, contactName, userType, schoolName, department, positionTitle, principalName, phone
  FROM users
  WHERE email LIKE '%@somersetacademy.edu'
     OR email LIKE '%@doralacademy.edu'
     OR email LIKE '%@miamiarts.edu'
     OR email LIKE '%@pinecrestprep.edu'
     OR email LIKE '%@keysgatecharter.edu'
     OR email LIKE '%@somersetsilver.edu'
     OR email LIKE '%@academica.com'
`).all();

// Get products
const products = db.prepare('SELECT id, name FROM products').all();

if (users.length === 0) {
  console.error('No dummy users found. Run seedUsers.js first.');
  process.exit(1);
}

if (products.length === 0) {
  console.error('No products found in database.');
  process.exit(1);
}

console.log(`Found ${users.length} users and ${products.length} products\n`);

const statuses = ['new', 'waiting_feedback', 'in_progress', 'on_hold', 'waiting_signoff', 'sent_to_print', 'completed'];

// Helper to get random items from array
const randomItems = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const randomStatus = () => statuses[Math.floor(Math.random() * statuses.length)];
const randomQuantity = () => Math.floor(Math.random() * 5) + 1;
const randomDaysAgo = (max) => {
  const days = Math.floor(Math.random() * max);
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Create orders
const orders = [
  // Maria Gonzalez - 2 orders
  { userEmail: 'maria.gonzalez@somersetacademy.edu', productCount: 3, status: 'in_progress', daysAgo: 2 },
  { userEmail: 'maria.gonzalez@somersetacademy.edu', productCount: 2, status: 'completed', daysAgo: 30 },

  // James Wilson - 1 order
  { userEmail: 'james.wilson@doralacademy.edu', productCount: 4, status: 'new', daysAgo: 1 },

  // Sarah Johnson - 2 orders
  { userEmail: 'sarah.johnson@miamiarts.edu', productCount: 2, status: 'waiting_feedback', daysAgo: 5 },
  { userEmail: 'sarah.johnson@miamiarts.edu', productCount: 1, status: 'completed', daysAgo: 45 },

  // David Lee - 1 order
  { userEmail: 'david.lee@pinecrestprep.edu', productCount: 5, status: 'sent_to_print', daysAgo: 7 },

  // Jennifer Brown - 2 orders
  { userEmail: 'jennifer.brown@keysgatecharter.edu', productCount: 2, status: 'on_hold', daysAgo: 10, notes: 'Waiting for updated school logo from client' },
  { userEmail: 'jennifer.brown@keysgatecharter.edu', productCount: 3, status: 'new', daysAgo: 0 },

  // Michael Davis - 1 order
  { userEmail: 'michael.davis@somersetsilver.edu', productCount: 2, status: 'waiting_signoff', daysAgo: 3 },

  // Emily Martinez (Academica) - 2 orders
  { userEmail: 'emily.martinez@academica.com', productCount: 4, status: 'in_progress', daysAgo: 4, forSchool: 'Somerset Academy Miramar' },
  { userEmail: 'emily.martinez@academica.com', productCount: 2, status: 'completed', daysAgo: 60, forSchool: 'Doral Academy Preparatory' },

  // Robert Taylor (Academica) - 1 order
  { userEmail: 'robert.taylor@academica.com', productCount: 3, status: 'new', daysAgo: 1, forSchool: 'Keys Gate Charter School' },

  // Amanda White (Academica) - 1 order
  { userEmail: 'amanda.white@academica.com', productCount: 2, status: 'waiting_feedback', daysAgo: 6, forSchool: 'Pinecrest Preparatory Academy' },

  // Christopher Garcia (Academica) - 1 order
  { userEmail: 'christopher.garcia@academica.com', productCount: 3, status: 'sent_to_print', daysAgo: 8, forSchool: 'Miami Arts Charter' },
];

const stmt = db.prepare(`
  INSERT INTO orders (id, userId, items, total, status, shippingInfo, notes, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

console.log('Creating orders...\n');

for (const orderData of orders) {
  const user = users.find(u => u.email === orderData.userEmail);
  if (!user) {
    console.log(`User not found: ${orderData.userEmail}`);
    continue;
  }

  const selectedProducts = randomItems(products, orderData.productCount);
  const items = selectedProducts.map(p => ({
    id: p.id,
    name: p.name,
    quantity: randomQuantity(),
    selectedOptions: {
      size: ['Small', 'Medium', 'Large'][Math.floor(Math.random() * 3)],
      quantity: ['25', '50', '100', '250', '500'][Math.floor(Math.random() * 5)],
    }
  }));

  const isAcademica = user.userType === 'academica_employee';

  const shippingInfo = {
    schoolName: isAcademica ? orderData.forSchool : user.schoolName,
    contactName: user.contactName,
    positionTitle: isAcademica ? user.department : user.positionTitle,
    principalName: isAcademica ? 'N/A' : user.principalName,
    email: user.email,
    phone: user.phone,
    orderedBy: isAcademica ? 'academica_employee' : 'school_staff',
    department: isAcademica ? user.department : null,
  };

  const orderId = uuidv4();
  const createdAt = randomDaysAgo(orderData.daysAgo);

  try {
    stmt.run(
      orderId,
      user.id,
      JSON.stringify(items),
      0, // No pricing in this system
      orderData.status,
      JSON.stringify(shippingInfo),
      orderData.notes || null,
      createdAt
    );
    console.log(`Created order for ${user.contactName} - ${orderData.status} (${items.length} items)`);
  } catch (error) {
    console.error(`Error creating order for ${user.email}:`, error.message);
  }
}

console.log('\n--- Orders Created ---\n');

// Summary
const orderCounts = db.prepare(`
  SELECT u.contactName, u.email, COUNT(o.id) as orderCount
  FROM users u
  LEFT JOIN orders o ON u.id = o.userId
  WHERE u.email LIKE '%@somersetacademy.edu'
     OR u.email LIKE '%@doralacademy.edu'
     OR u.email LIKE '%@miamiarts.edu'
     OR u.email LIKE '%@pinecrestprep.edu'
     OR u.email LIKE '%@keysgatecharter.edu'
     OR u.email LIKE '%@somersetsilver.edu'
     OR u.email LIKE '%@academica.com'
  GROUP BY u.id
`).all();

console.log('Orders per user:');
orderCounts.forEach(u => {
  console.log(`  ${u.contactName}: ${u.orderCount} order(s)`);
});

const statusCounts = db.prepare(`
  SELECT status, COUNT(*) as count FROM orders GROUP BY status
`).all();

console.log('\nOrders by status:');
statusCounts.forEach(s => {
  console.log(`  ${s.status}: ${s.count}`);
});

console.log('\nDone!');
