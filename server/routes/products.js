import express from 'express';
import { Product } from '../models/Product.js';

const router = express.Router();

// Get all products with optional filters
router.get('/', (req, res) => {
  try {
    const { category, subcategory, search, inStock } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (subcategory) filters.subcategory = subcategory;
    if (search) filters.search = search;
    if (inStock !== undefined) filters.inStock = inStock === 'true';

    const products = Product.getAll(filters);
    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all categories
router.get('/categories', (req, res) => {
  try {
    const categories = Product.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single product
router.get('/:id', (req, res) => {
  try {
    const product = Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;
