import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: join(__dirname, '.env') });

import { initializeDatabase } from './utils/database.js';
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

// Serve uploaded files (proofs, attachments)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

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

// Download endpoint - serves files with Content-Disposition: attachment
app.get('/api/download', (req, res) => {
  const { file, name } = req.query;

  if (!file) {
    return res.status(400).json({ error: 'File path required' });
  }

  // Security: Only allow files from uploads directory
  if (!file.startsWith('/uploads/')) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Convert URL path to filesystem path
  const filePath = join(__dirname, file.replace('/uploads/', 'uploads/'));

  if (!existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Use provided filename or extract from path
  const downloadName = name || basename(filePath);

  res.download(filePath, downloadName, (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    }
  });
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
