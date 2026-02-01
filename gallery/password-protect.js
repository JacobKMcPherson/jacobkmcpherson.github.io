// Password protection for gallery page
// The password hash is injected at build time from GitHub secrets

(function() {
  'use strict';
  
  // Password hash injected at build time - DO NOT COMMIT ACTUAL HASH
  // Default hash is SHA-256 of 'temp' - will be replaced by workflow if GALLERY_PASSWORD secret is set
  const PASSWORD_HASH = 'a6864eb339b0e1f6e00d75293a8840abf069a2c0fe82e6e53af6ac099793c1d5';
  const DEFAULT_HASH = 'a6864eb339b0e1f6e00d75293a8840abf069a2c0fe82e6e53af6ac099793c1d5';
  
  // Session storage key
  const AUTH_KEY = 'gallery_authenticated';
  
  // Warn if using default password
  if (PASSWORD_HASH === DEFAULT_HASH) {
    console.warn('Gallery is using default password. Please set GALLERY_PASSWORD secret for production use.');
  }
  
  // Simple SHA-256 hash function
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
  
  // Check if already authenticated in this session
  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }
  
  // Mark as authenticated
  function setAuthenticated() {
    sessionStorage.setItem(AUTH_KEY, 'true');
  }
  
  // Create password prompt overlay
  function createPasswordPrompt() {
    const overlay = document.createElement('div');
    overlay.id = 'password-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    const promptBox = document.createElement('div');
    promptBox.style.cssText = `
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
      text-align: center;
    `;
    
    promptBox.innerHTML = `
      <h2 style="margin-top: 0; color: #333;">Gallery Access</h2>
      <p style="color: #666; margin-bottom: 20px;">This gallery is password protected. Please enter the password to continue.</p>
      <input type="password" id="gallery-password-input" 
        placeholder="Enter password" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box; margin-bottom: 15px;">
      <div id="password-error" style="color: #d32f2f; margin-bottom: 15px; min-height: 20px; font-size: 14px;"></div>
      <button id="gallery-password-submit" 
        style="width: 100%; padding: 12px; background: #2780e3; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: bold;">
        Unlock Gallery
      </button>
    `;
    
    overlay.appendChild(promptBox);
    document.body.appendChild(overlay);
    
    return overlay;
  }
  
  // Verify password
  async function verifyPassword(password) {
    const hash = await sha256(password);
    return hash === PASSWORD_HASH;
  }
  
  // Handle password submission
  async function handlePasswordSubmit(overlay) {
    const input = document.getElementById('gallery-password-input');
    const errorDiv = document.getElementById('password-error');
    const submitBtn = document.getElementById('gallery-password-submit');
    const password = input.value;
    
    if (!password) {
      errorDiv.textContent = 'Please enter a password';
      return;
    }
    
    // Prevent multiple submissions
    if (submitBtn.disabled) {
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';
    errorDiv.textContent = '';
    
    try {
      const isValid = await verifyPassword(password);
      
      if (isValid) {
        setAuthenticated();
        overlay.remove();
        showContent();
      } else {
        errorDiv.textContent = 'Incorrect password. Please try again.';
        input.value = '';
        input.focus();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Unlock Gallery';
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      errorDiv.textContent = 'An error occurred. Please try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Unlock Gallery';
    }
  }
  
  // Hide content initially
  function hideContent() {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.style.display = 'none';
    }
  }
  
  // Show content after authentication
  function showContent() {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.style.display = 'block';
    }
  }
  
  // Initialize password protection
  function init() {
    if (isAuthenticated()) {
      showContent();
      return;
    }
    
    hideContent();
    const overlay = createPasswordPrompt();
    
    const input = document.getElementById('gallery-password-input');
    const submitBtn = document.getElementById('gallery-password-submit');
    
    // Handle button click
    submitBtn.addEventListener('click', () => {
      handlePasswordSubmit(overlay).catch(error => {
        console.error('Unhandled error in password submission:', error);
      });
    });
    
    // Handle Enter key press
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handlePasswordSubmit(overlay).catch(error => {
          console.error('Unhandled error in password submission:', error);
        });
      }
    });
    
    // Focus on input after a short delay
    setTimeout(() => input.focus(), 100);
  }
  
  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
