const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Middleware to verify Firebase ID token from cookie
async function verifyUser(req, res, next) {
  try {
    const idToken = req.cookies.__session;
    if (!idToken) return res.redirect('/login');
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res.redirect('/login');
  }
}

// Dashboard: list all patients
router.get('/dashboard', verifyUser, async (req, res) => {
  const snapshot = await db.collection('patients').get();
  const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.render('dashboard', { user: req.user, patients });
});

// Form to add patient
router.get('/add-patient', verifyUser, (req, res) => {
  res.render('add_patient', { user: req.user });
});

// Save patient to Firestore
router.post('/add-patient', verifyUser, async (req, res) => {
  const { name, age, condition, notesEncrypted } = req.body;
  await db.collection('patients').add({
    name,
    age: parseInt(age),
    condition,
    notesEncrypted,
    createdBy: req.user.uid,
    createdAt: new Date()
  });
  res.redirect('/dashboard');
});

// View one patient
router.get('/patient/:id', verifyUser, async (req, res) => {
  const doc = await db.collection('patients').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).send('Patient not found');
  res.render('patient_view', { patient: { id: doc.id, ...doc.data() } });
});

module.exports = router;
