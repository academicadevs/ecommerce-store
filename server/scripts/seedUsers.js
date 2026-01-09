import db from '../utils/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

async function seedUsers() {
  console.log('Seeding dummy users...\n');

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password, userType, contactName, positionTitle, department, schoolName, principalName, phone, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of dummyUsers) {
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
      console.log(`Created: ${user.contactName} (${user.email})`);
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        console.log(`Skipped (already exists): ${user.email}`);
      } else {
        console.error(`Error creating ${user.email}:`, error.message);
      }
    }
  }

  console.log('\n--- Dummy Users Created ---\n');
  console.log('All users have password: password123\n');
  console.log('School Staff:');
  dummyUsers.filter(u => u.userType === 'school_staff').forEach(u => {
    console.log(`  ${u.email} - ${u.contactName} (${u.schoolName})`);
  });
  console.log('\nAcademica Employees:');
  dummyUsers.filter(u => u.userType === 'academica_employee').forEach(u => {
    console.log(`  ${u.email} - ${u.contactName} (${u.department})`);
  });
}

seedUsers().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
