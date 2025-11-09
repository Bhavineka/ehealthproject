// auth.js - Firebase Authentication functions

// Initialize Firebase immediately when this script loads
// By this time, firebase SDK and firebaseConfig are already loaded
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();


setTimeout(() => {
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized');
    }
  } catch (error) {
    console.error('Firebase init error:', error);
  }
}, 100);
/**
 * Sign up a new user
 */
async function signup(email, password, name) {
  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    await userCred.user.updateProfile({ displayName: name });
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

/**
 * Monitor auth state
 */
auth.onAuthStateChanged(user => {
  if (!user) {
    if (!window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup')) {
      window.location.href = '/login';
    }
  }
});