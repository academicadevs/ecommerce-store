import express from 'express';
import { Office } from '../models/Office.js';

const router = express.Router();

// GET /api/offices - Get all active offices (public endpoint)
router.get('/', (req, res) => {
  try {
    const offices = Office.getActive();
    res.json({ offices });
  } catch (error) {
    console.error('Error fetching offices:', error);
    res.status(500).json({ error: 'Failed to fetch offices' });
  }
});

// GET /api/offices/:id - Get a specific office by ID (public endpoint)
router.get('/:id', (req, res) => {
  try {
    const office = Office.findById(req.params.id);
    if (!office) {
      return res.status(404).json({ error: 'Office not found' });
    }
    res.json({ office });
  } catch (error) {
    console.error('Error fetching office:', error);
    res.status(500).json({ error: 'Failed to fetch office' });
  }
});

export default router;
