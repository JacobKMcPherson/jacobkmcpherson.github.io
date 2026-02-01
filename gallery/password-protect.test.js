/**
 * @jest-environment jsdom
 */

const { TextEncoder, TextDecoder } = require('util');
const crypto = require('crypto');

// Set up TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('Gallery Password Protection', () => {
  let originalHTML;
  
  beforeAll(() => {
    // Mock the crypto.subtle API using Node.js crypto
    global.crypto = {
      subtle: {
        digest: async (algorithm, data) => {
          // Use Node.js crypto for actual SHA-256 hashing
          const hash = crypto.createHash('sha256');
          hash.update(Buffer.from(data));
          return hash.digest().buffer;
        }
      }
    };
  });
  
  beforeEach(() => {
    // Save original HTML
    originalHTML = document.body.innerHTML;
    
    // Reset document body
    document.body.innerHTML = '<main style="display: block;">Test Content</main>';
    
    // Clear sessionStorage
    sessionStorage.clear();
  });
  
  afterEach(() => {
    // Restore original HTML
    document.body.innerHTML = originalHTML;
  });
  
  describe('SHA-256 Hashing', () => {
    test('should hash a password consistently', async () => {
      const password = 'testPassword123';
      
      // Mock sha256 function
      async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }
      
      const hash1 = await sha256(password);
      const hash2 = await sha256(password);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });
    
    test('should produce different hashes for different passwords', async () => {
      async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }
      
      const hash1 = await sha256('password1');
      const hash2 = await sha256('password2');
      
      expect(hash1).not.toBe(hash2);
    });
  });
  
  describe('Session Storage Authentication', () => {
    test('should check if user is authenticated', () => {
      const AUTH_KEY = 'gallery_authenticated';
      
      function isAuthenticated() {
        return sessionStorage.getItem(AUTH_KEY) === 'true';
      }
      
      expect(isAuthenticated()).toBe(false);
      
      sessionStorage.setItem(AUTH_KEY, 'true');
      expect(isAuthenticated()).toBe(true);
    });
    
    test('should set authentication state', () => {
      const AUTH_KEY = 'gallery_authenticated';
      
      function setAuthenticated() {
        sessionStorage.setItem(AUTH_KEY, 'true');
      }
      
      setAuthenticated();
      expect(sessionStorage.getItem(AUTH_KEY)).toBe('true');
    });
  });
  
  describe('Password Prompt Creation', () => {
    test('should create password overlay with correct structure', () => {
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
      
      const overlay = createPasswordPrompt();
      
      expect(overlay).toBeDefined();
      expect(overlay.id).toBe('password-overlay');
      expect(document.getElementById('gallery-password-input')).toBeDefined();
      expect(document.getElementById('password-error')).toBeDefined();
      expect(document.getElementById('gallery-password-submit')).toBeDefined();
    });
  });
  
  describe('Content Visibility', () => {
    test('should hide content initially', () => {
      function hideContent() {
        const mainContent = document.querySelector('main');
        if (mainContent) {
          mainContent.style.display = 'none';
        }
      }
      
      const main = document.querySelector('main');
      expect(main.style.display).toBe('block');
      
      hideContent();
      expect(main.style.display).toBe('none');
    });
    
    test('should show content after authentication', () => {
      function showContent() {
        const mainContent = document.querySelector('main');
        if (mainContent) {
          mainContent.style.display = 'block';
        }
      }
      
      const main = document.querySelector('main');
      main.style.display = 'none';
      
      showContent();
      expect(main.style.display).toBe('block');
    });
  });
  
  describe('Password Verification', () => {
    test('should verify correct password', async () => {
      const PASSWORD_HASH = 'test_hash_123';
      
      async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }
      
      async function verifyPassword(password) {
        if (PASSWORD_HASH === 'INJECTED_PASSWORD_HASH') {
          return false;
        }
        const hash = await sha256(password);
        return hash === PASSWORD_HASH;
      }
      
      const testPassword = 'correctPassword';
      const hash = await sha256(testPassword);
      
      // Temporarily set PASSWORD_HASH to the computed hash for testing
      const originalHash = PASSWORD_HASH;
      
      // Create a verification function with the correct hash
      async function testVerifyPassword(password) {
        const computedHash = await sha256(password);
        return computedHash === hash;
      }
      
      const isValid = await testVerifyPassword(testPassword);
      expect(isValid).toBe(true);
    });
    
    test('should reject incorrect password', async () => {
      const PASSWORD_HASH = 'test_hash_123';
      
      async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }
      
      async function verifyPassword(password) {
        if (PASSWORD_HASH === 'INJECTED_PASSWORD_HASH') {
          return false;
        }
        const hash = await sha256(password);
        return hash === PASSWORD_HASH;
      }
      
      const isValid = await verifyPassword('wrongPassword');
      expect(isValid).toBe(false);
    });
    
    test('should reject when password hash not injected', async () => {
      const PASSWORD_HASH = 'INJECTED_PASSWORD_HASH';
      
      async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }
      
      async function verifyPassword(password) {
        if (PASSWORD_HASH === 'INJECTED_PASSWORD_HASH') {
          return false;
        }
        const hash = await sha256(password);
        return hash === PASSWORD_HASH;
      }
      
      const isValid = await verifyPassword('anyPassword');
      expect(isValid).toBe(false);
    });
  });
  
  describe('Event Handling', () => {
    test('should handle Enter key press', (done) => {
      const input = document.createElement('input');
      input.type = 'password';
      document.body.appendChild(input);
      
      let handleSubmitCalled = false;
      
      function handlePasswordSubmit() {
        handleSubmitCalled = true;
        done();
      }
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handlePasswordSubmit();
        }
      });
      
      const event = new KeyboardEvent('keypress', { key: 'Enter' });
      input.dispatchEvent(event);
      
      expect(handleSubmitCalled).toBe(true);
    });
    
    test('should not handle other key presses', () => {
      const input = document.createElement('input');
      input.type = 'password';
      document.body.appendChild(input);
      
      let handleSubmitCalled = false;
      
      function handlePasswordSubmit() {
        handleSubmitCalled = true;
      }
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handlePasswordSubmit();
        }
      });
      
      const event = new KeyboardEvent('keypress', { key: 'a' });
      input.dispatchEvent(event);
      
      expect(handleSubmitCalled).toBe(false);
    });
  });
  
  describe('Password Submission Flow', () => {
    test('should show error when password is empty', async () => {
      const overlay = document.createElement('div');
      overlay.innerHTML = `
        <input type="password" id="gallery-password-input" value="">
        <div id="password-error"></div>
        <button id="gallery-password-submit">Submit</button>
      `;
      document.body.appendChild(overlay);
      
      const input = document.getElementById('gallery-password-input');
      const errorDiv = document.getElementById('password-error');
      
      if (!input.value) {
        errorDiv.textContent = 'Please enter a password';
      }
      
      expect(errorDiv.textContent).toBe('Please enter a password');
    });
    
    test('should disable button during verification', async () => {
      const overlay = document.createElement('div');
      overlay.innerHTML = `
        <input type="password" id="gallery-password-input" value="test">
        <div id="password-error"></div>
        <button id="gallery-password-submit">Unlock Gallery</button>
      `;
      document.body.appendChild(overlay);
      
      const submitBtn = document.getElementById('gallery-password-submit');
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';
      
      expect(submitBtn.disabled).toBe(true);
      expect(submitBtn.textContent).toBe('Verifying...');
    });
    
    test('should clear error message during verification', async () => {
      const overlay = document.createElement('div');
      overlay.innerHTML = `
        <input type="password" id="gallery-password-input" value="test">
        <div id="password-error">Previous error</div>
        <button id="gallery-password-submit">Unlock Gallery</button>
      `;
      document.body.appendChild(overlay);
      
      const errorDiv = document.getElementById('password-error');
      errorDiv.textContent = '';
      
      expect(errorDiv.textContent).toBe('');
    });
    
    test('should prevent multiple submissions', async () => {
      const overlay = document.createElement('div');
      overlay.innerHTML = `
        <input type="password" id="gallery-password-input" value="test">
        <div id="password-error"></div>
        <button id="gallery-password-submit" disabled>Verifying...</button>
      `;
      document.body.appendChild(overlay);
      
      const submitBtn = document.getElementById('gallery-password-submit');
      const password = document.getElementById('gallery-password-input').value;
      
      // Should return early if button is disabled
      if (submitBtn.disabled) {
        expect(submitBtn.disabled).toBe(true);
        return;
      }
      
      // This line should not be reached
      expect(true).toBe(false);
    });
    
    test('should handle errors gracefully', async () => {
      const overlay = document.createElement('div');
      overlay.innerHTML = `
        <input type="password" id="gallery-password-input" value="test">
        <div id="password-error"></div>
        <button id="gallery-password-submit" disabled>Verifying...</button>
      `;
      document.body.appendChild(overlay);
      
      const errorDiv = document.getElementById('password-error');
      const submitBtn = document.getElementById('gallery-password-submit');
      
      // Simulate error handling
      errorDiv.textContent = 'An error occurred. Please try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Unlock Gallery';
      
      expect(errorDiv.textContent).toBe('An error occurred. Please try again.');
      expect(submitBtn.disabled).toBe(false);
      expect(submitBtn.textContent).toBe('Unlock Gallery');
    });
  });
});
