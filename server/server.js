import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: join(__dirname, '.env') });

import { initializeDatabase, syncProductOverviews } from './utils/database.js';
import { Product } from './models/Product.js';
import { User } from './models/User.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import webhookRoutes from './routes/webhooks.js';
import proofRoutes from './routes/proofs.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for product images (placeholder)
app.use('/images', express.static(join(__dirname, 'public/images')));

// Uploads directory - use Railway volume in production, local in development
const uploadsDir = process.env.UPLOADS_PATH || join(__dirname, 'uploads');

// Ensure uploads directories exist
const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
ensureDir(join(uploadsDir, 'proofs'));
ensureDir(join(uploadsDir, 'attachments'));
ensureDir(join(uploadsDir, 'products'));

// Export for use in other modules
export { uploadsDir };

// Download endpoint for attachments (must come before static serving)
app.get('/uploads/attachments/:filename/download', (req, res) => {
  const filePath = join(uploadsDir, 'attachments', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filePath);
});

// Serve uploaded files (proofs, attachments)
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/proofs', proofRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(clientBuildPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
async function start() {
  try {
    // Initialize database
    initializeDatabase();

    // Seed sample products
    Product.seedProducts();

    // Sync product overviews (must run after products exist)
    syncProductOverviews();

    // Create default admin user if none exists
    const adminEmail = process.env.ADMIN_EMAIL || 'seth.clark@academicanv.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await User.createAdmin({ email: adminEmail, password: adminPassword });
    console.log(`Admin user created/verified: ${adminEmail}`);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
