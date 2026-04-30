'Entries: 1/999999 (Not Modified Often)'

// checkout-success/js/success.js

const BACKEND_URL = 'https://backend.lockin.tech';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('lockin_auth_token');
    
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    const loadingIcon = document.getElementById('loadingIcon');
    const checkIcon = document.getElementById('checkIcon');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const actionButtons = document.getElementById('actionButtons');

    if (!token) {
        pageTitle.textContent = "You're logged out";
        pageSubtitle.textContent = "Your payment may have succeeded, but you have been logged out of this browser. Please log in again to view your account.";
        loadingIcon.style.display = 'none';
        
        const loginBtn = document.createElement('a');
        loginBtn.href = '/account/login.html';
        loginBtn.className = 'btn btn--primary btn--md';
        loginBtn.textContent = 'Log in';
        
        actionButtons.innerHTML = '';
        actionButtons.appendChild(loginBtn);
        actionButtons.style.display = 'flex';
        return;
    }

    if (!sessionId) {
        pageTitle.textContent = "Invalid session";
        pageSubtitle.textContent = "We couldn't verify this checkout session because no identifier was provided in the URL. If you completed a payment, it should be active shortly.";
        loadingIcon.style.display = 'none';
        
        const accBtn = document.createElement('a');
        accBtn.href = '/account/index.html';
        accBtn.className = 'btn btn--outline btn--md';
        accBtn.textContent = 'Go to Account';
        
        actionButtons.innerHTML = '';
        actionButtons.appendChild(accBtn);
        actionButtons.style.display = 'flex';
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/payments/session-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, session_id: sessionId })
        });

        const data = await response.json();

        if (response.status === 200 && data.success) {
            // Payment verified and processed
            loadingIcon.style.display = 'none';
            checkIcon.style.display = 'flex';
            pageTitle.textContent = "Payment Successful!";
            pageSubtitle.textContent = "Your account has been upgraded. You now have full access to study materials.";
            
            // To be safe, force a profile refresh behind the scenes by clearing old cached `lockin_user` object
            // The dashboard handles refetching the clean object on boot
            localStorage.removeItem('lockin_user');
            
            actionButtons.style.display = 'flex';

            // Auto-redirect after a few seconds smoothly
            setTimeout(() => {
                window.location.href = '/account/index.html?t=' + new Date().getTime();
            }, 3500);

        } else if (response.status === 202) {
            // Pending webhook
            loadingIcon.style.display = 'none';
            checkIcon.style.display = 'flex';
            pageTitle.textContent = "Payment processing...";
            pageSubtitle.textContent = "Stripe is currently verifying your payment. Your subscription should be active within a few seconds.";
            actionButtons.style.display = 'flex';
        } else {
            // Error explicitly returned
            throw new Error(data.message || 'Payment status unknown.');
        }

    } catch (error) {
        console.error('Session verification error:', error);
        loadingIcon.style.display = 'none';
        pageTitle.textContent = "Verification delayed";
        pageSubtitle.textContent = "We encountered a network delay speaking to Stripe, but if your payment went through, it will process automatically in the background shortly.";
        
        const accBtn = document.createElement('a');
        accBtn.href = '/account/index.html';
        accBtn.className = 'btn btn--primary btn--md';
        accBtn.textContent = 'Go to Account';
        
        actionButtons.innerHTML = '';
        actionButtons.appendChild(accBtn);
        actionButtons.style.display = 'flex';
    }
});