// auth.js - Firebase Authentication with Role Management

// Initialize Firebase ONCE
if (!firebase.apps || firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

/**
 * Sign up a new user with role
 */
async function signup(email, password, name, role) {
  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    await userCred.user.updateProfile({ displayName: name });
    
    // Save user role in Firestore
    await db.collection('users').doc(userCred.user.uid).set({
      name: name,
      email: email,
      role: role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    const token = await userCred.user.getIdToken();
    document.cookie = `__session=${token}; path=/`;
    
    alert('Account created successfully!');
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Signup Error:', error);
    alert(error.message);
  }
}

/**
 * Login existing user
 */
async function login(email, password) {
  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);
    const token = await userCred.user.getIdToken();
    document.cookie = `__session=${token}; path=/`;
    
    alert('Login successful!');
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Login Error:', error);
    alert(error.message);
  }
}

/**
 * Logout the current user
 */
async function logout() {
  try {
    await auth.signOut();
    document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout Error:', error);
    alert('Error logging out. Please try again.');
  }
}