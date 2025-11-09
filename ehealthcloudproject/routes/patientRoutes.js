const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Middleware to verify Firebase ID token from cookie
async function verifyUser(req, res, next) {
  try {
    const idToken = req.cookies.__session;
    if (!idToken) {
      console.log('No session token found');
      return res.redirect('/login');
    }
    
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.clearCookie('__session');
    return res.redirect('/login');
  }
}

// Dashboard: list all patients
router.get('/dashboard', verifyUser, async (req, res) => {
  try {
    const snapshot = await db.collection('patients').get();
    const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.render('dashboard', { user: req.user, patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Form to add patient
router.get('/add-patient', verifyUser, (req, res) => {
  res.render('add_patient', { user: req.user });
});

// Save patient to Firestore
router.post('/add-patient', verifyUser, async (req, res) => {
  try {
    const { name, age, condition, notesEncrypted } = req.body;
    
    // Validation
    if (!name || !age || !condition) {
      return res.status(400).send('Missing required fields');
    }
    
    await db.collection('patients').add({
      name: name.trim(),
      age: parseInt(age),
      condition: condition.trim(),
      notesEncrypted: notesEncrypted || '',
      createdBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error adding patient:', error);
    res.status(500).send('Error adding patient');
  }
});

// View one patient
router.get('/patient/:id', verifyUser, async (req, res) => {
  try {
    const doc = await db.collection('patients').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).send('Patient not found');
    }
    
    res.render('patient_view', { patient: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).send('Error loading patient details');
  }
});

module.exports = router;