const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Middleware to verify Firebase ID token and get user role
async function verifyUser(req, res, next) {
  try {
    const idToken = req.cookies.__session;
    if (!idToken) {
      return res.redirect('/login');
    }
    
    const decoded = await admin.auth().verifyIdToken(idToken);
    
    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) {
      return res.redirect('/login');
    }
    
    req.user = {
      ...decoded,
      role: userDoc.data().role,
      name: userDoc.data().name
    };
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.clearCookie('__session');
    return res.redirect('/login');
  }
}

// Role-based middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).send('Access denied - Insufficient permissions');
    }
    next();
  };
}

// Universal Dashboard - redirects based on role
router.get('/dashboard', verifyUser, async (req, res) => {
  const role = req.user.role;
  
  if (role === 'admin') {
    return res.redirect('/admin-dashboard');
  } else if (role === 'doctor') {
    return res.redirect('/doctor-dashboard');
  } else if (role === 'patient') {
    return res.redirect('/patient-dashboard');
  }
  
  res.status(403).send('Invalid role');
});

// ========== ADMIN DASHBOARD ==========
router.get('/admin-dashboard', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const doctorsSnapshot = await db.collection('users').where('role', '==', 'doctor').get();
    const patientsSnapshot = await db.collection('users').where('role', '==', 'patient').get();
    
    const doctors = doctorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const patients = patientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.render('admin_dashboard', { user: req.user, doctors, patients });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error loading admin dashboard');
  }
});

router.get('/manage-doctors', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const doctorsSnapshot = await db.collection('users').where('role', '==', 'doctor').get();
    const doctors = doctorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.render('manage_doctors', { user: req.user, doctors });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error loading doctors');
  }
});

router.post('/add-doctor', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).send('Missing required fields');
    }
    
    // Create doctor account in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name
    });
    
    // Save doctor info in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name: name,
      email: email,
      role: 'doctor',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: req.user.uid
    });
    
    res.redirect('/manage-doctors');
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).send('Error adding doctor: ' + error.message);
  }
});

router.post('/delete-doctor/:id', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    // Delete from Firestore
    await db.collection('users').doc(doctorId).delete();
    
    // Delete from Firebase Auth
    await admin.auth().deleteUser(doctorId);
    
    res.redirect('/manage-doctors');
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).send('Error deleting doctor');
  }
});

router.get('/manage-patients', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const patientsSnapshot = await db.collection('patients').get();
    const patients = patientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.render('manage_patients', { user: req.user, patients });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error loading patients');
  }
});

// Delete patient record
router.post('/delete-patient/:id', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    await db.collection('patients').doc(req.params.id).delete();
    res.redirect('/manage-patients');
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).send('Error deleting patient');
  }
});
// ========== DOCTOR DASHBOARD ==========
router.get('/doctor-dashboard', verifyUser, requireRole('doctor'), async (req, res) => {
  try {
    const patientsSnapshot = await db.collection('patients').get();
    const patients = patientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.render('doctor_dashboard', { user: req.user, patients });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error loading doctor dashboard');
  }
});

// ========== PATIENT DASHBOARD ==========
router.get('/patient-dashboard', verifyUser, requireRole('patient'), async (req, res) => {
  try {
    // Get only this patient's records
    const snapshot = await db.collection('patients')
      .where('patientUid', '==', req.user.uid)
      .get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.render('patient_dashboard', { user: req.user, records });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error loading patient dashboard');
  }
});

// ========== ADD PATIENT (Doctor and Admin only) ==========
router.get('/add-patient', verifyUser, requireRole('doctor', 'admin'), (req, res) => {
  res.render('add_patient', { user: req.user });
});

router.post('/add-patient', verifyUser, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const { name, age, condition, notesEncrypted } = req.body;
    
    if (!name || !age || !condition) {
      return res.status(400).send('Missing required fields');
    }
    
    await db.collection('patients').add({
      name: name.trim(),
      age: parseInt(age),
      condition: condition.trim(),
      notesEncrypted: notesEncrypted || '',
      addedBy: req.user.uid,
      addedByRole: req.user.role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error adding patient:', error);
    res.status(500).send('Error adding patient');
  }
});

// ========== VIEW PATIENT (All roles) ==========
router.get('/patient/:id', verifyUser, async (req, res) => {
  try {
    const doc = await db.collection('patients').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).send('Patient not found');
    }
    
    const patientData = doc.data();
    
    // Patients can only view their own records
    if (req.user.role === 'patient' && patientData.patientUid !== req.user.uid) {
      return res.status(403).send('Access denied');
    }
    
    res.render('patient_view', { 
      patient: { id: doc.id, ...patientData },
      user: req.user 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error loading patient details');
  }
});

module.exports = router;