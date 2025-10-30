const BACKEND_URL = 'https://backend.lockin.tech';

// Check if already logged in
const token = sessionStorage.getItem('admin_token');
if (token) {
    // Verify token is still valid and has admin/owner role
    verifyExistingToken(token);
}

// Google Sign-In callback handler
async function handleCredentialResponse(response) {
    console.log("Google Sign-In credential received");
    
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
    
    try {
        // Send credential to backend
        const backendResponse = await fetch(`${BACKEND_URL}/auth/google_signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                credential: response.credential
            })
        });

        const data = await backendResponse.json();
        console.log('Backend response:', data);
        
        if (data.success) {
            // Check if user has admin or owner role
            if (data.user.role === 'admin' || data.user.role === 'owner') {
                // Store token and user info
                sessionStorage.setItem('admin_token', data.token);
                sessionStorage.setItem('admin_user', JSON.stringify(data.user));
                
                // Redirect to admin dashboard
                window.location.href = '/admin/';
            } else {
                // User doesn't have sufficient permissions
                errorMessage.textContent = 'Insufficient permissions. Admin or Owner role required.';
                errorMessage.style.display = 'block';
                
                // Log them out from the backend
                await fetch(`${BACKEND_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: data.token })
                });
            }
        } else {
            // Sign-in failed
            errorMessage.textContent = data.message || 'Google Sign-In failed. Please try again.';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        // Network or server error
        errorMessage.textContent = 'Connection error during Google Sign-In. Please try again.';
        errorMessage.style.display = 'block';
        console.error('Google Sign-In error:', error);
    }
}

async function verifyExistingToken(token) {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/verify_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const data = await response.json();
        
        if (data.success && (data.user.role === 'admin' || data.user.role === 'owner')) {
            // Valid admin/owner token, redirect to dashboard
            window.location.href = '/admin/';
        } else {
            // Token invalid or insufficient permissions, clear it
            sessionStorage.removeItem('admin_token');
        }
    } catch (error) {
        // Error verifying, clear token
        sessionStorage.removeItem('admin_token');
    }
}

const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const submitButton = loginForm.querySelector('button[type="submit"]');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const identifier = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Hide previous error and disable button
    errorMessage.style.display = 'none';
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    
    try {
        // Call backend login endpoint
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();
        
        if (data.success) {
            // Check if user has admin or owner role
            if (data.user.role === 'admin' || data.user.role === 'owner') {
                // Store token and user info
                sessionStorage.setItem('admin_token', data.token);
                sessionStorage.setItem('admin_user', JSON.stringify(data.user));
                
                // Redirect to admin dashboard
                window.location.href = '/admin/';
            } else {
                // User doesn't have sufficient permissions
                errorMessage.textContent = 'Insufficient permissions. Admin or Owner role required.';
                errorMessage.style.display = 'block';
                
                // Log them out from the backend
                await fetch(`${BACKEND_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: data.token })
                });
            }
        } else {
            // Login failed
            errorMessage.textContent = data.message || 'Invalid username/email or password';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        // Network or server error
        errorMessage.textContent = 'Connection error. Please try again.';
        errorMessage.style.display = 'block';
        console.error('Login error:', error);
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
});
