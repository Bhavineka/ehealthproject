// auth.js - Firebase Authentication functions

// 1️⃣ Initialize Firebase
firebase.initializeApp(firebaseConfig);

// 2️⃣ Initialize auth (must be **before** any function)
const auth = firebase.auth();

/**
 * Sign up a new user
 * @param {string} email 
 * @param {string} password 
 * @param {string} name 
 */
async function signup(email, password, name) {
  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);

    // Update display name
    await userCred.user.updateProfile({ displayName: name });

    // Optional: save session token in cookie
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
 * @param {string} email 
 * @param {string} password 
 */
async function login(email, password) {
  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);

    // Save session token in cookie
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
 * Optional: monitor auth state
 * Redirect to login if user is not authenticated
 */
auth.onAuthStateChanged(user => {
  if (!user) {
    // Not logged in, redirect unless on login/signup page
    if (!window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup')) {
      window.location.href = '/login';
    }
  }
});
