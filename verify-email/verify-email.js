/**
 * Email Verification Page - Lockin.tech
 * Handles automatic email verification when user clicks link from email
 */

const BACKEND_URL = 'https://backend.lockin.tech';

// DOM Elements
const verifyingView = document.getElementById('verifyingView');
const successView = document.getElementById('successView');
const alreadyVerifiedView = document.getElementById('alreadyVerifiedView');
const invalidTokenView = document.getElementById('invalidTokenView');
const noTokenView = document.getElementById('noTokenView');
const errorView = document.getElementById('errorView');
const errorMessage = document.getElementById('errorMessage');

// Get token from URL if present
const urlParams = new URLSearchParams(window.location.search);
const verificationToken = urlParams.get('token');

// Initialize page based on whether token is present
function init() {
    if (verificationToken) {
        showView('verifying');
        verifyEmail(verificationToken);
    } else {
        showView('noToken');
    }
}

// Show specific view and hide others
function showView(viewName) {
    verifyingView.style.display = 'none';
    successView.style.display = 'none';
    alreadyVerifiedView.style.display = 'none';
    invalidTokenView.style.display = 'none';
    noTokenView.style.display = 'none';
    errorView.style.display = 'none';
    
    switch(viewName) {
        case 'verifying':
            verifyingView.style.display = 'flex';
            break;
        case 'success':
            successView.style.display = 'flex';
            break;
        case 'alreadyVerified':
            alreadyVerifiedView.style.display = 'flex';
            break;
        case 'invalidToken':
            invalidTokenView.style.display = 'flex';
            break;
        case 'noToken':
            noTokenView.style.display = 'flex';
            break;
        case 'error':
            errorView.style.display = 'flex';
            break;
    }
}

// Verify email with token
async function verifyEmail(token) {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/verify_email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Check if already verified or newly verified
            if (data.message && data.message.toLowerCase().includes('already verified')) {
                showView('alreadyVerified');
            } else {
                showView('success');
            }
        } else {
            // Check if token is invalid/expired
            if (data.message && (
                data.message.toLowerCase().includes('expired') || 
                data.message.toLowerCase().includes('invalid')
            )) {
                showView('invalidToken');
            } else {
                // Generic error
                setErrorMessage(data.message || 'Verification failed. Please try again.');
                showView('error');
            }
        }
        
    } catch (error) {
        console.error('Email verification error:', error);
        setErrorMessage('Connection error. Please check your internet connection and try again.');
        showView('error');
    }
}

// Set error message
function setErrorMessage(message) {
    errorMessage.textContent = message;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Intellectual Property of Hugisoft (hugisoft.com)
