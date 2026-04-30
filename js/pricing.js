'Entries: 6/999999 (Not Modified Often)'

// js/pricing.js — Stripe checkout handoff

const BACKEND_URL = 'https://backend.lockin.tech';

export function initPricing() {
  const checkoutButtons = document.querySelectorAll('.js-checkout-btn');

  checkoutButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const token = localStorage.getItem('lockin_auth_token');
      if (!token) {
        // Not logged in -> Redirect to auth flow with redirect param
        window.location.href = '/account/login.html?redirect=pricing';
        return;
      }

      const tierCode = btn.getAttribute('data-tier');
      const originalText = btn.innerHTML;
      const errorMsg = document.getElementById(`error-${tierCode}`);
      
      // Reset error state
      if (errorMsg) errorMsg.style.display = 'none';

      // Set loading state
      btn.disabled = true;
      btn.textContent = 'Preparing checkout...';

      try {
        const response = await fetch(`${BACKEND_URL}/payments/create-checkout-session`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token, tier_code: tierCode })
        });

        const data = await response.json();

        if (data.success && (data.url || data.checkout_url)) {
            // Redirect to Stripe Checkout Session
            window.location.href = data.url || data.checkout_url;
        } else {
            console.error('Checkout failed:', data.message);
            if (errorMsg) {
                errorMsg.textContent = data.message || 'Checkout failed. Please try again.';
                errorMsg.style.display = 'block';
            }
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
      } catch (error) {
        console.error('Checkout network error:', error);
        if (errorMsg) {
            errorMsg.textContent = 'Connection error. Please try again.';
            errorMsg.style.display = 'block';
        }
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  });
}

