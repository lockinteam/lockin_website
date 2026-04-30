'Entries: 5/999999 (Not Modified Often)'

const BACKEND_URL = 'https://backend.lockin.tech';

// Check if already logged in -> redirect to /account/ or index.html if you want
const token = localStorage.getItem('lockin_auth_token');
if (token) {
  window.location.href = '/account/index.html?t=' + new Date().getTime();
}

let isSignUp = false;

const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const signupFields = document.getElementById('signupFields');
const submitBtn = document.getElementById('submitBtn');
const authForm = document.getElementById('authForm');
const authError = document.getElementById('authError');
const emailLabel = document.getElementById('emailLabel');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

function setSignUpState(active) {
  isSignUp = active;
  if (active) {
    formTitle.textContent = 'Create an account';
    formSubtitle.textContent = 'Sign up to upgrade to Pro and access more revision materials.';
    signupFields.style.display = 'flex';
    usernameInput.required = true;
    emailLabel.textContent = 'Email Address';
    emailInput.placeholder = 'student@example.com';
    submitBtn.textContent = 'Sign up';
    toggleText.textContent = 'Already have an account?';
    toggleBtn.textContent = 'Log in';
  } else {
    formTitle.textContent = 'Log in to Lockin';
    formSubtitle.textContent = 'Welcome back! Manage your subscription directly on the web.';
    signupFields.style.display = 'none';
    usernameInput.required = false;
    emailLabel.textContent = 'Username or Email';
    emailInput.placeholder = 'username / email@example.com';
    submitBtn.textContent = 'Log in';
    toggleText.textContent = "Don't have an account?";
    toggleBtn.textContent = 'Sign up';
  }
}

// Initial state
setSignUpState(false);

toggleBtn.addEventListener('click', (e) => {
  e.preventDefault();
  setSignUpState(!isSignUp);
  authError.style.display = 'none';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  authError.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Please wait...';
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const username = usernameInput.value.trim();
  
  const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
  
  let payload;
  if (isSignUp) {
    payload = { email, password, username };
  } else {
    payload = { identifier: email, password };
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.success) {
      // Store auth session
      localStorage.setItem('lockin_auth_token', data.token);
      localStorage.setItem('lockin_user', JSON.stringify(data.user));
      
      // Redirect back to intended page or index
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect === 'pricing') {
        window.location.href = '/#pricing';
      } else {
        window.location.href = '/account/index.html?t=' + new Date().getTime();
      }
    } else {
      authError.textContent = data.message || 'Authentication failed.';
      authError.style.display = 'block';
    }
  } catch (error) {
    authError.textContent = 'Connection error. Please try again.';
    authError.style.display = 'block';
    console.error('Auth error:', error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isSignUp ? 'Sign up' : 'Log in';
  }
});

// Google Sign-In Callback
window.handleCredentialResponse = async function(response) {
  console.log("Google Sign-In credential received");
  authError.style.display = 'none';
  
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/auth/google_signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    });

    const data = await backendResponse.json();
    
    if (data.success) {
      localStorage.setItem('lockin_auth_token', data.token);
      localStorage.setItem('lockin_user', JSON.stringify(data.user));
      
      const params = new URLSearchParams(window.location.search);
      if (params.get('redirect') === 'pricing') {
        window.location.href = '/#pricing';
      } else {
        window.location.href = '/';
      }
    } else {
      authError.textContent = data.message || 'Google Sign-In failed.';
      authError.style.display = 'block';
    }
  } catch (error) {
    authError.textContent = 'Connection error during Google Sign-In.';
    authError.style.display = 'block';
    console.error('Google Sign-In error:', error);
  }
};
