const BACKEND_URL = 'https://backend.lockin.tech';
let currentUser = null;

// Check for session token and verify with backend
async function checkAuth() {
    const token = sessionStorage.getItem('admin_token');
    
    if (!token) {
        // No token found, redirect to login
        window.location.href = '/admin/login/';
        return;
    }

    try {
        // Verify token with backend
        const response = await fetch(`${BACKEND_URL}/auth/verify_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const data = await response.json();
        
        if (data.success && (data.user.role === 'admin' || data.user.role === 'owner')) {
            // Valid admin/owner token
            currentUser = data.user;
            sessionStorage.setItem('admin_user', JSON.stringify(data.user));
            loadAdminDashboard();
        } else {
            // Token invalid or insufficient permissions
            showInsufficientPermissions(data.user);
        }
    } catch (error) {
        console.error('Auth verification error:', error);
        // On error, redirect to login
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_user');
        window.location.href = '/admin/login/';
    }
}

function showInsufficientPermissions(user) {
    const content = document.querySelector('.admin-content');
    content.innerHTML = `
        <div class="dashboard" style="text-align: center; padding: 3rem;">
            <h2 style="color: var(--color-deep-blue);">Insufficient Permissions</h2>
            <p style="color: var(--color-grey-text); margin: 2rem 0;">
                ${user ? `Your account (${user.username}) does not have admin or owner privileges.` : 'You do not have sufficient permissions to access this area.'}
            </p>
            <p style="color: var(--color-grey-text); margin-bottom: 2rem;">
                Only users with <strong>Admin</strong> or <strong>Owner</strong> roles can access the admin portal.
            </p>
            <button onclick="logoutAndRedirect()" class="btn btn-primary">Return to Login</button>
        </div>
    `;
    
    // Auto logout after showing message
    setTimeout(logoutAndRedirect, 5000);
}

function loadAdminDashboard() {
    const content = document.querySelector('.admin-content');
    const roleColor = currentUser.role === 'owner' ? 'var(--color-accent-teal)' : 'var(--color-primary-blue)';
    
    content.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-title-section">
                <h1 class="admin-title">Admin Portal</h1>
                <p class="admin-subtitle">Welcome back, <span style="color: ${roleColor};">${currentUser.username}</span></p>
            </div>
            
            <div class="management-options">
                <a href="#" class="management-card" onclick="navigateToUsers(event)">
                    <div class="management-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <h3>User Management</h3>
                    <p>Manage users, roles, and permissions</p>
                </a>
                
                <a href="#" class="management-card" onclick="navigateToContent(event)">
                    <div class="management-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                        </svg>
                    </div>
                    <h3>Content Management</h3>
                    <p>Manage courses, topics, notes, and resources</p>
                </a>
            </div>
        </div>
    `;
}

async function logout() {
    const token = sessionStorage.getItem('admin_token');
    
    if (token) {
        try {
            // Call backend logout
            await fetch(`${BACKEND_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    logoutAndRedirect();
}

function logoutAndRedirect() {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    window.location.href = '/admin/login/';
}

function navigateToUsers(e) {
    e.preventDefault();
    window.location.href = '/admin/users/';
}

function navigateToContent(e) {
    e.preventDefault();
    window.location.href = '/admin/content/';
}

// Run auth check on page load
checkAuth();
