'Entries: 5/999999 (Not Modified Often)'

// js/account.js — Standalone account dashboard logic

const BACKEND_URL = 'https://backend.lockin.tech';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('lockin_auth_token');

    if (!token) {
        // Redirect completely out if no auth token exists
        window.location.href = '/account/login.html';
        return;
    }

    const loadingState = document.getElementById('loadingState');
    const contentState = document.getElementById('contentState');
    const accUsername = document.getElementById('accUsername');
    const accEmail = document.getElementById('accEmail');
    const accTierBadge = document.getElementById('accTierBadge');
    
    const upgradeBtn = document.getElementById('upgradeBtn');
    const portalError = document.getElementById('portalError');
    const logoutBtn = document.getElementById('logoutBtn');

    try {
        // Fetch the user's active session profile 
        const response = await fetch(`${BACKEND_URL}/fetch/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token })
        });

        if (!response.ok) throw new Error('Session invalid');
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.user) {
            const user = data.data.user;
            accUsername.textContent = user.username || 'Student';
            accEmail.textContent = user.email || '';

            // Handle Subscriptions visually
            let tierCode = 'free';
            let tierName = 'Lockin Free';
            
            if (user.subscription && user.subscription.tier_code !== 'free') {
                tierCode = user.subscription.tier_code.toLowerCase();
                tierName = user.subscription.tier_name;
            }

            accTierBadge.textContent = tierName;
            
            if (tierCode === 'super' || tierCode === 'premium') {
                accTierBadge.className = 'badge badge--super';
                // Max tier reached
            } else if (tierCode === 'pro') {
                accTierBadge.className = 'badge badge--pro';
                upgradeBtn.style.display = 'inline-flex'; // Pro users can still upgrade
            } else {
                accTierBadge.className = 'badge badge--free';
                upgradeBtn.style.display = 'inline-flex';
            }

            // Reveal Content
            loadingState.style.display = 'none';
            contentState.style.display = 'block';
        } else {
            throw new Error('Invalid token session');
        }

    } catch (err) {
        console.error('Profile fetch failed:', err);
        // Clear broken token
        localStorage.removeItem('lockin_auth_token');
        localStorage.removeItem('lockin_user');
        window.location.href = '/account/login.html';
    }

    // Simple Logout Logic
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Clear local storage tokens 
        localStorage.removeItem('lockin_auth_token');
        localStorage.removeItem('lockin_user');
        // Force page refresh to redirect bounds via JS top checks
        window.location.reload();
    })
});