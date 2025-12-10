/**
 * Password Reset Page - Lockin.tech
 * Handles both requesting password reset and resetting password with token
 */

const BACKEND_URL = 'https://backend.lockin.tech';

// DOM Elements
const requestResetView = document.getElementById('requestResetView');
const resetPasswordView = document.getElementById('resetPasswordView');
const successView = document.getElementById('successView');
const invalidTokenView = document.getElementById('invalidTokenView');

const requestResetForm = document.getElementById('requestResetForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');

const emailInput = document.getElementById('email');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

const requestMessage = document.getElementById('requestMessage');
const resetMessage = document.getElementById('resetMessage');

// Get token from URL if present
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

// Initialize page based on whether token is present
function init() {
    if (resetToken) {
        showView('resetPassword');
        setupPasswordValidation();
    } else {
        showView('requestReset');
    }
    
    setupPasswordToggles();
    setupFormHandlers();
}

// Show specific view and hide others
function showView(viewName) {
    requestResetView.style.display = 'none';
    resetPasswordView.style.display = 'none';
    successView.style.display = 'none';
    invalidTokenView.style.display = 'none';
    
    switch(viewName) {
        case 'requestReset':
            requestResetView.style.display = 'flex';
            break;
        case 'resetPassword':
            resetPasswordView.style.display = 'flex';
            break;
        case 'success':
            successView.style.display = 'flex';
            break;
        case 'invalidToken':
            invalidTokenView.style.display = 'flex';
            break;
    }
}

// Setup form submission handlers
function setupFormHandlers() {
    // Request reset form
    requestResetForm.addEventListener('submit', handleRequestReset);
    
    // Reset password form
    resetPasswordForm.addEventListener('submit', handleResetPassword);
}

// Handle request password reset
async function handleRequestReset(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const submitBtn = requestResetForm.querySelector('button[type="submit"]');
    
    // Hide previous messages
    hideMessage(requestMessage);
    
    // Show loading state
    setButtonLoading(submitBtn, true);
    
    try {
        const response = await fetch(`${BACKEND_URL}/auth/request_password_reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        // Always show success message (security - don't reveal if email exists)
        showMessage(requestMessage, 'success', 
            "If an account exists with this email, you'll receive a reset link shortly. Check your inbox and spam folder.");
        
        // Clear the form
        emailInput.value = '';
        
    } catch (error) {
        console.error('Request reset error:', error);
        showMessage(requestMessage, 'error', 
            'Connection error. Please check your internet connection and try again.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// Handle reset password
async function handleResetPassword(e) {
    e.preventDefault();
    
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const submitBtn = document.getElementById('resetSubmitBtn');
    
    // Hide previous messages
    hideMessage(resetMessage);
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showMessage(resetMessage, 'error', "Passwords don't match. Please try again.");
        confirmPasswordInput.classList.add('input-error');
        confirmPasswordInput.focus();
        return;
    }
    
    // Validate password requirements
    if (!validatePassword(newPassword)) {
        showMessage(resetMessage, 'error', 
            'Password must be at least 8 characters with uppercase, lowercase, and a number.');
        return;
    }
    
    // Show loading state
    setButtonLoading(submitBtn, true);
    
    try {
        const response = await fetch(`${BACKEND_URL}/auth/reset_password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: resetToken,
                password: newPassword 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success view
            showView('success');
        } else {
            // Check if token is invalid/expired
            if (data.message && (
                data.message.toLowerCase().includes('expired') || 
                data.message.toLowerCase().includes('invalid')
            )) {
                showView('invalidToken');
            } else {
                showMessage(resetMessage, 'error', 
                    data.message || 'Failed to reset password. Please try again.');
            }
        }
        
    } catch (error) {
        console.error('Reset password error:', error);
        showMessage(resetMessage, 'error', 
            'Connection error. Please check your internet connection and try again.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// Password validation
function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return minLength && hasUppercase && hasLowercase && hasNumber;
}

// Setup real-time password validation
function setupPasswordValidation() {
    const requirements = {
        length: (p) => p.length >= 8,
        uppercase: (p) => /[A-Z]/.test(p),
        lowercase: (p) => /[a-z]/.test(p),
        number: (p) => /[0-9]/.test(p)
    };
    
    newPasswordInput.addEventListener('input', () => {
        const password = newPasswordInput.value;
        
        Object.keys(requirements).forEach(req => {
            const element = document.querySelector(`[data-requirement="${req}"]`);
            if (element) {
                if (requirements[req](password)) {
                    element.classList.add('met');
                } else {
                    element.classList.remove('met');
                }
            }
        });
    });
    
    // Remove error state when typing in confirm password
    confirmPasswordInput.addEventListener('input', () => {
        confirmPasswordInput.classList.remove('input-error');
        hideMessage(resetMessage);
    });
}

// Setup password visibility toggles
function setupPasswordToggles() {
    const toggles = document.querySelectorAll('.password-toggle');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const wrapper = toggle.closest('.password-input-wrapper');
            const input = wrapper.querySelector('input');
            const eyeOpen = toggle.querySelector('.eye-open');
            const eyeClosed = toggle.querySelector('.eye-closed');
            
            if (input.type === 'password') {
                input.type = 'text';
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                input.type = 'password';
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });
    });
}

// Show message helper
function showMessage(element, type, text) {
    element.textContent = text;
    element.className = `message message--${type}`;
    element.style.display = 'block';
}

// Hide message helper
function hideMessage(element) {
    element.style.display = 'none';
}

// Set button loading state
function setButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline-flex';
    } else {
        button.disabled = false;
        if (btnText) btnText.style.display = 'inline-flex';
        if (btnLoading) btnLoading.style.display = 'none';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Intellectual Property of Hugisoft (hugisoft.com)
