import express from 'express';
import { School } from '../models/School.js';

const router = express.Router();

// GET /api/schools - Get all active schools (public endpoint)
router.get('/', (req, res) => {
  try {
    const schools = School.getActive();
    res.json({ schools });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// GET /api/schools/:id - Get a specific school by ID (public endpoint)
router.get('/:id', (req, res) => {
  try {
    const school = School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    res.json({ school });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
});

export default router;
