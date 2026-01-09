import db from '../utils/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Dummy Users
const dummyUsers = [
  // School Staff (6 users)
  {
    email: 'maria.gonzalez@somersetacademy.edu',
    password: 'password123',
    userType: 'school_staff',
    contactName: 'Maria Gonzalez',
    positionTitle: 'Marketing Coordinator',
    schoolName: 'Somerset Academy',
    principalName: 'Dr. Robert Chen',
    phone: '(305) 555-0101',
  },
  {
    email: 'james.wilson@doralacademy.edu',
    password: 'password123',
    userType: 'school_staff',
    contactName: 'James Wilson',
    positionTitle: 'Assistant Principal',
    schoolName: 'Doral Academy',
    principalName: 'Dr. Patricia Martinez',
    phone: '(305) 555-0102',
  },
  {
    email: 'sarah.johnson@miamiarts.edu',
    password: 'password123',
    userType: 'school_staff',
    contactName: 'Sarah Johnson',
    positionTitle: 'Office Manager',
    schoolName: 'Miami Arts Charter',
    principalName: 'Michael Thompson',
    phone: '(305) 555-0103',
  },
  {
    email: 'david.lee@pinecrestprep.edu',
    password: 'password123',
    userType: 'school_staff',
    contactName: 'David Lee',
    positionTitle: 'Events Coordinator',
    schoolName: 'Pinecrest Preparatory Academy',
    principalName: 'Dr. Amanda Foster',
    phone: '(305) 555-0104',
  },
  {
    email: 'jennifer.brown@keysgatecharter.edu',
    password: 'password123',
    userType: 'school_staff',
    contactName: 'Jennifer Brown',
    positionTitle: 'Administrative Assistant',
    schoolName: 'Keys Gate Charter School',
    principalName: 'William Rodriguez',
    phone: '(305) 555-0105',
  },
  {
    email: 'michael.davis@somersetsilver.edu',
    password: 'password123',
    userType: 'school_staff',
    contactName: 'Michael Davis',
    positionTitle: 'Dean of Students',
    schoolName: 'Somerset Academy Silver Palms',
    principalName: 'Dr. Lisa Chang',
    phone: '(305) 555-0106',
  },
  // Academica Employees (4 users)
  {
    email: 'emily.martinez@academica.com',
    password: 'password123',
    userType: 'academica_employee',
    contactName: 'Emily Martinez',
    department: 'Marketing',
    schoolName: 'Academica Corporate',
    phone: '(305) 555-0201',
  },
  {
    email: 'robert.taylor@academica.com',
    password: 'password123',
    userType: 'academica_employee',
    contactName: 'Robert Taylor',
    department: 'Communications',
    schoolName: 'Academica Corporate',
    phone: '(305) 555-0202',
  },
  {
    email: 'amanda.white@academica.com',
    password: 'password123',
    userType: 'academica_employee',
    contactName: 'Amanda White',
    department: 'Operations',
    schoolName: 'Academica Corporate',
    phone: '(305) 555-0203',
  },
  {
    email: 'christopher.garcia@academica.com',
    password: 'password123',
    userType: 'academica_employee',
    contactName: 'Christopher Garcia',
    department: 'School Support',
    schoolName: 'Academica Corporate',
    phone: '(305) 555-0204',
  },
];

export async function seedUsers() {
  console.log('Seeding users...');

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password, userType, contactName, positionTitle, department, schoolName, principalName, phone, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let created = 0;
  for (const user of dummyUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
    if (existing) continue;

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(user.password, 10);

    try {
      stmt.run(
        id,
        user.email,
        hashedPassword,
        user.userType,
        user.contactName,
        user.positionTitle || null,
        user.department || null,
        user.schoolName || null,
        user.principalName || null,
        user.phone || null,
        'user'
      );
      created++;
    } catch (error) {
      console.error(`Error creating ${user.email}:`, error.message);
    }
  }

  console.log(`Created ${created} users`);
  return created;
}

export async function seedOrders() {
  console.log('Seeding orders...');

  // Get users
  const users = db.prepare(`
    SELECT id, email, contactName, userType, schoolName, department, positionTitle, principalName, phone
    FROM users
    WHERE userType IN ('school_staff', 'academica_employee')
    AND email NOT LIKE '%@academicanv.com'
  `).all();

  // Get products
  const products = db.prepare('SELECT id, name FROM products').all();

  if (users.length === 0 || products.length === 0) {
    console.log('No users or products found, skipping orders');
    return 0;
  }

  const statuses = ['new', 'waiting_feedback', 'in_progress', 'on_hold', 'waiting_signoff', 'sent_to_print', 'completed'];

  const randomItems = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  const randomQuantity = () => Math.floor(Math.random() * 5) + 1;

  // Check if orders already exist
  const existingOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  if (existingOrders.count > 5) {
    console.log('Orders already exist, skipping');
    return 0;
  }

  const orderConfigs = [
    { userEmail: 'maria.gonzalez@somersetacademy.edu', productCount: 3, status: 'in_progress' },
    { userEmail: 'maria.gonzalez@somersetacademy.edu', productCount: 2, status: 'completed' },
    { userEmail: 'james.wilson@doralacademy.edu', productCount: 4, status: 'new' },
    { userEmail: 'sarah.johnson@miamiarts.edu', productCount: 2, status: 'waiting_feedback' },
    { userEmail: 'sarah.johnson@miamiarts.edu', productCount: 1, status: 'completed' },
    { userEmail: 'david.lee@pinecrestprep.edu', productCount: 5, status: 'sent_to_print' },
    { userEmail: 'jennifer.brown@keysgatecharter.edu', productCount: 2, status: 'on_hold', notes: 'Waiting for updated school logo' },
    { userEmail: 'jennifer.brown@keysgatecharter.edu', productCount: 3, status: 'new' },
    { userEmail: 'michael.davis@somersetsilver.edu', productCount: 2, status: 'waiting_signoff' },
    { userEmail: 'emily.martinez@academica.com', productCount: 4, status: 'in_progress', forSchool: 'Somerset Academy Miramar' },
    { userEmail: 'emily.martinez@academica.com', productCount: 2, status: 'completed', forSchool: 'Doral Academy Prep' },
    { userEmail: 'robert.taylor@academica.com', productCount: 3, status: 'new', forSchool: 'Keys Gate Charter' },
    { userEmail: 'amanda.white@academica.com', productCount: 2, status: 'waiting_feedback', forSchool: 'Pinecrest Prep' },
    { userEmail: 'christopher.garcia@academica.com', productCount: 3, status: 'sent_to_print', forSchool: 'Miami Arts Charter' },
  ];

  const stmt = db.prepare(`
    INSERT INTO orders (id, orderNumber, userId, items, total, status, shippingInfo, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let created = 0;
  const dailyCounts = {};

  for (const config of orderConfigs) {
    const user = users.find(u => u.email === config.userEmail);
    if (!user) continue;

    const selectedProducts = randomItems(products, config.productCount);
    const items = selectedProducts.map(p => ({
      id: p.id,
      name: p.name,
      quantity: randomQuantity(),
      selectedOptions: { size: 'Medium', quantity: '100' }
    }));

    const isAcademica = user.userType === 'academica_employee';
    const shippingInfo = {
      schoolName: isAcademica ? config.forSchool : user.schoolName,
      contactName: user.contactName,
      positionTitle: isAcademica ? user.department : user.positionTitle,
      principalName: isAcademica ? 'N/A' : user.principalName,
      email: user.email,
      phone: user.phone,
      orderedBy: isAcademica ? 'academica_employee' : 'school_staff',
      department: isAcademica ? user.department : null,
    };

    // Generate order number
    const now = new Date();
    const nameParts = user.contactName.trim().split(/\s+/);
    const namePrefix = (nameParts[0].substring(0, 2) + nameParts[nameParts.length - 1].substring(0, 2)).toUpperCase();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    const dateStr = `${month}${day}${year}`;
    const dateKey = dateStr;
    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    const orderNumber = `${namePrefix}-${dateStr}-${dailyCounts[dateKey].toString().padStart(3, '0')}`;

    try {
      stmt.run(
        uuidv4(),
        orderNumber,
        user.id,
        JSON.stringify(items),
        0,
        config.status,
        JSON.stringify(shippingInfo),
        config.notes || null,
        now.toISOString()
      );
      created++;
    } catch (error) {
      console.error(`Error creating order:`, error.message);
    }
  }

  console.log(`Created ${created} orders`);
  return created;
}

export async function seedAll() {
  console.log('=== Starting database seed ===');
  await seedUsers();
  await seedOrders();
  console.log('=== Seed complete ===');
}

// Run if called directly
if (process.argv[1].includes('seedAll')) {
  seedAll().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
