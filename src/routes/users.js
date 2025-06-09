const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const upload = require('../utils/fileUpload');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'profile', 'preferences'];
    const isValidOperation = Object.keys(updates).every(update => allowedUpdates.includes(update) || update.startsWith('profile.') || update.startsWith('preferences.'));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    // Handle deep nested updates (dot notation)
    Object.keys(updates).forEach(key => {
      if (key.startsWith('profile.')) {
        const path = key.split('.').slice(1); // remove 'profile'
        let obj = req.user.profile;
        for (let i = 0; i < path.length - 1; i++) {
          if (!obj[path[i]]) obj[path[i]] = {};
          obj = obj[path[i]];
        }
        obj[path[path.length - 1]] = updates[key];
      } else if (key.startsWith('preferences.')) {
        const path = key.split('.').slice(1);
        let obj = req.user.preferences;
        for (let i = 0; i < path.length - 1; i++) {
          if (!obj[path[i]]) obj[path[i]] = {};
          obj = obj[path[i]];
        }
        obj[path[path.length - 1]] = updates[key];
      }
    });

    // Handle full object updates
    if (updates.profile) {
      Object.keys(updates.profile).forEach(key => {
        req.user.profile[key] = updates.profile[key];
      });
    }
    if (updates.preferences) {
      Object.keys(updates.preferences).forEach(key => {
        req.user.preferences[key] = updates.preferences[key];
      });
    }
    if (updates.name) {
      req.user.name = updates.name;
    }

    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upload profile picture
router.post('/profile/picture', auth, upload.single('picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    req.user.profile.picture = req.file.path;
    await req.user.save();
    res.json({ message: 'Profile picture uploaded successfully' });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Error uploading profile picture' });
  }
});

// Get doctor's availability
router.get('/doctors/:id/availability', auth, async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
      .select('profile.availability');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor.profile.availability);
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({ message: 'Error fetching doctor availability' });
  }
});

// Update doctor's availability
router.patch('/availability', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can update availability' });
    }

    req.user.profile.availability = req.body.availability;
    await req.user.save();
    res.json(req.user.profile.availability);
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Error updating availability' });
  }
});

// Get all doctors
router.get('/doctors', auth, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name email profile.specialization profile.qualifications profile.experience');
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// Search doctors
router.get('/doctors/search', auth, async (req, res) => {
  try {
    const { specialization, name } = req.query;
    const query = { role: 'doctor' };

    if (specialization) {
      query['profile.specialization'] = new RegExp(specialization, 'i');
    }

    if (name) {
      query.name = new RegExp(name, 'i');
    }

    const doctors = await User.find(query)
      .select('name email profile.specialization profile.qualifications profile.experience');
    res.json(doctors);
  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({ message: 'Error searching doctors' });
  }
});

// Update notification preferences
router.patch('/preferences/notifications', auth, async (req, res) => {
  try {
    req.user.preferences.notifications = {
      ...req.user.preferences.notifications,
      ...req.body
    };
    await req.user.save();
    res.json(req.user.preferences.notifications);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Error updating notification preferences' });
  }
});

module.exports = router; 