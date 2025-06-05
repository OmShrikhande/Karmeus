// ===== COMPREHENSIVE SECURITY SYSTEM =====

class SecurityManager {
  constructor() {
    // Load configuration
    this.config = window.SECURITY_CONFIG || {
      SESSION: { TIMEOUT: 30 * 60 * 1000 },
      LOGIN: { MAX_ATTEMPTS: 5, LOCKOUT_DURATION: 15 * 60 * 1000 },
      RATE_LIMIT: { REQUESTS_PER_MINUTE: 60 }
    };
    
    this.maxLoginAttempts = this.config.LOGIN.MAX_ATTEMPTS;
    this.lockoutDuration = this.config.LOGIN.LOCKOUT_DURATION;
    this.sessionTimeout = this.config.SESSION.TIMEOUT;
    this.maxRequestsPerMinute = this.config.RATE_LIMIT.REQUESTS_PER_MINUTE;
    this.csrfToken = this.generateCSRFToken();
    this.init();
  }

  init() {
    this.setupCSP();
    this.setupSessionManagement();
    this.setupInputSanitization();
    this.setupRateLimiting();
    this.setupSecurityHeaders();
    this.monitorSuspiciousActivity();
    
    // Initialize advanced security features after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initAdvancedSecurity();
      });
    } else {
      this.initAdvancedSecurity();
    }
  }

  // ===== CSRF Protection =====
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  validateCSRFToken(token) {
    return token === this.csrfToken;
  }

  addCSRFTokenToForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (!form.querySelector('input[name="csrf_token"]')) {
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        csrfInput.value = this.csrfToken;
        form.appendChild(csrfInput);
      }
    });
  }

  // ===== Input Sanitization =====
  setupInputSanitization() {
    // Set up automatic input sanitization for all forms
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const originalValue = e.target.value;
        
        // Enhanced validation
        const validation = this.validateInput(originalValue, e.target.type || 'text');
        if (!validation.isValid) {
          e.target.value = '';
          e.target.style.borderColor = 'red';
          console.warn('Malicious input detected and blocked:', validation.threats);
          
          // Show user-friendly message
          const message = document.createElement('div');
          message.textContent = 'Invalid input detected. Please enter safe content.';
          message.style.color = 'red';
          message.style.fontSize = '12px';
          message.style.marginTop = '2px';
          
          // Remove any existing error message
          const existingError = e.target.parentNode.querySelector('.security-error');
          if (existingError) {
            existingError.remove();
          }
          
          message.className = 'security-error';
          e.target.parentNode.appendChild(message);
          
          // Remove error message after 3 seconds
          setTimeout(() => {
            if (message.parentNode) {
              message.remove();
              e.target.style.borderColor = '';
            }
          }, 3000);
          
          return;
        }
        
        // Regular sanitization
        const sanitizedValue = this.sanitizeInput(originalValue);
        if (originalValue !== sanitizedValue) {
          e.target.value = sanitizedValue;
          console.warn('Input was sanitized for security');
        }
      }
    });
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove script tags and dangerous content
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();
  }

  validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  validatePassword(password) {
    // Strong password requirements
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  }

  // ===== Rate Limiting =====
  setupRateLimiting() {
    this.rateLimits = new Map();
  }

  checkRateLimit(identifier) {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    if (!this.rateLimits.has(identifier)) {
      this.rateLimits.set(identifier, []);
    }
    
    const requests = this.rateLimits.get(identifier);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    this.rateLimits.set(identifier, recentRequests);
    
    if (recentRequests.length >= this.maxRequestsPerMinute) {
      return false; // Rate limit exceeded
    }
    
    // Add current request
    recentRequests.push(now);
    return true;
  }

  // ===== Login Attempt Monitoring =====
  trackLoginAttempt(email, success) {
    const key = `login_attempts_${email}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    const now = Date.now();
    
    // Remove attempts older than lockout duration
    const recentAttempts = attempts.filter(attempt => 
      now - attempt.timestamp < this.lockoutDuration
    );
    
    recentAttempts.push({
      timestamp: now,
      success: success,
      ip: this.getClientIP()
    });
    
    localStorage.setItem(key, JSON.stringify(recentAttempts));
    
    if (!success) {
      const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
      if (failedAttempts.length >= this.maxLoginAttempts) {
        this.lockAccount(email);
        return false;
      }
    } else {
      // Clear failed attempts on successful login
      localStorage.removeItem(key);
    }
    
    return true;
  }

  isAccountLocked(email) {
    const key = `login_attempts_${email}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    const now = Date.now();
    
    const recentFailedAttempts = attempts.filter(attempt => 
      !attempt.success && (now - attempt.timestamp < this.lockoutDuration)
    );
    
    return recentFailedAttempts.length >= this.maxLoginAttempts;
  }

  lockAccount(email) {
    console.warn(`Account locked for ${email} due to too many failed login attempts`);
    this.logSecurityEvent('ACCOUNT_LOCKED', { email, timestamp: Date.now() });
  }

  // ===== Session Management =====
  setupSessionManagement() {
    this.startSessionTimer();
    this.setupActivityMonitoring();
  }

  startSessionTimer() {
    // Clear any existing timer
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    
    this.sessionTimer = setTimeout(() => {
      this.expireSession();
    }, this.sessionTimeout);
  }

  resetSessionTimer() {
    this.startSessionTimer();
  }

  expireSession() {
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('userSession');
    sessionStorage.clear();
    
    alert('Your session has expired for security reasons. Please log in again.');
    window.location.href = '../index.html';
  }

  setupActivityMonitoring() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.resetSessionTimer();
      }, true);
    });
  }

  // ===== Content Security Policy =====
  setupCSP() {
    // Note: CSP via meta tags has limitations. For production, use HTTP headers.
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://*.firebaseio.com https://*.googleapis.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com https://firebase.googleapis.com wss://*.firebaseio.com;
      font-src 'self' https://fonts.gstatic.com;
      frame-src https://*.firebaseio.com;
    `.replace(/\s+/g, ' ').trim();
    
    document.head.appendChild(meta);
  }

  // ===== Security Headers =====
  setupSecurityHeaders() {
    // X-Frame-Options
    const frameOptions = document.createElement('meta');
    frameOptions.httpEquiv = 'X-Frame-Options';
    frameOptions.content = 'DENY';
    document.head.appendChild(frameOptions);
    
    // X-Content-Type-Options
    const contentType = document.createElement('meta');
    contentType.httpEquiv = 'X-Content-Type-Options';
    contentType.content = 'nosniff';
    document.head.appendChild(contentType);
    
    // Referrer Policy
    const referrer = document.createElement('meta');
    referrer.name = 'referrer';
    referrer.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrer);
  }

  // ===== Suspicious Activity Monitoring =====
  monitorSuspiciousActivity() {
    // Monitor for rapid form submissions
    let formSubmissionCount = 0;
    let lastSubmissionTime = 0;
    
    document.addEventListener('submit', (e) => {
      const now = Date.now();
      if (now - lastSubmissionTime < 1000) { // Less than 1 second
        formSubmissionCount++;
        if (formSubmissionCount > 3) {
          e.preventDefault();
          this.logSecurityEvent('RAPID_FORM_SUBMISSION', { 
            timestamp: now,
            userAgent: navigator.userAgent 
          });
          alert('Suspicious activity detected. Please slow down.');
          return false;
        }
      } else {
        formSubmissionCount = 0;
      }
      lastSubmissionTime = now;
    });
    
    // Monitor for console access (developer tools)
    let devtools = false;
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > 200 || 
          window.outerWidth - window.innerWidth > 200) {
        if (!devtools) {
          devtools = true;
          this.logSecurityEvent('DEVTOOLS_OPENED', { timestamp: Date.now() });
        }
      } else {
        devtools = false;
      }
    }, 500);
  }

  // ===== Security Event Logging =====
  logSecurityEvent(eventType, data) {
    const securityLog = JSON.parse(localStorage.getItem('securityLog') || '[]');
    
    securityLog.push({
      type: eventType,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...data
    });
    
    // Keep only last 100 events
    if (securityLog.length > 100) {
      securityLog.splice(0, securityLog.length - 100);
    }
    
    localStorage.setItem('securityLog', JSON.stringify(securityLog));
    console.warn(`Security Event: ${eventType}`, data);
  }

  // ===== Utility Functions =====
  getClientIP() {
    // This would typically be done server-side
    return 'client-side-unknown';
  }

  generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }

  // ===== Public API =====
  secureFormSubmit(form, callback) {
    try {
      // Add CSRF token
      this.addCSRFTokenToForms();
      
      // Sanitize all inputs
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (input.type !== 'hidden' && input.name !== 'csrf_token') {
          input.value = this.sanitizeInput(input.value);
        }
      });
      
      // Check rate limiting
      const userEmail = localStorage.getItem('currentUserEmail') || 'anonymous';
      if (!this.checkRateLimit(userEmail)) {
        alert('Too many requests. Please wait a moment before trying again.');
        return false;
      }
      
      // Log form submission
      this.logSecurityEvent('FORM_SUBMIT', { 
        formId: form.id || 'unknown',
        userEmail: userEmail 
      });
      
      // Execute callback
      if (callback) {
        return callback();
      }
      
      return true;
    } catch (error) {
      console.error('Security form submit error:', error);
      return false;
    }
  }

  validateUserSession() {
    const userEmail = localStorage.getItem('currentUserEmail');
    const sessionData = localStorage.getItem('userSession');
    
    if (!userEmail || !sessionData) {
      this.logSecurityEvent('SESSION_INVALID', { reason: 'missing_data' });
      return false;
    }
    
    try {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      if (now - session.lastActivity > this.sessionTimeout) {
        this.logSecurityEvent('SESSION_EXPIRED', { userEmail });
        this.expireSession();
        return false;
      }
      
      // Update last activity
      session.lastActivity = now;
      localStorage.setItem('userSession', JSON.stringify(session));
      
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      this.logSecurityEvent('SESSION_ERROR', { error: error.message });
      this.expireSession();
      return false;
    }
  }

  // ===== Additional Security Features =====
  
  // Detect if user is using VPN/Proxy (basic check)
  detectVPN() {
    // This is a basic check - in production you'd use a proper service
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    this.logSecurityEvent('USER_ENVIRONMENT', { 
      timezone, 
      language,
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      cookieEnabled: navigator.cookieEnabled
    });
  }

  // Check for suspicious browser extensions
  detectSuspiciousExtensions() {
    // Check for common debugging/hacking extensions
    const suspiciousExtensions = [
      'chrome-extension://fhbjgbiflinjbdggehcddcbncdddomop', // Postman
      'chrome-extension://coohjcphdfgbiolnekdpbcijmhambjff', // ModHeader
    ];
    
    suspiciousExtensions.forEach(ext => {
      const img = new Image();
      img.onload = () => {
        this.logSecurityEvent('SUSPICIOUS_EXTENSION', { extension: ext });
      };
      img.src = ext + '/icon.png';
    });
  }

  // Monitor clipboard access
  monitorClipboard() {
    document.addEventListener('copy', () => {
      this.logSecurityEvent('CLIPBOARD_COPY', { timestamp: Date.now() });
    });
    
    document.addEventListener('paste', () => {
      this.logSecurityEvent('CLIPBOARD_PASTE', { timestamp: Date.now() });
    });
  }

  // Detect screen recording/sharing
  detectScreenRecording() {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      // Monitor for screen sharing attempts
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function(...args) {
        window.securityManager.logSecurityEvent('SCREEN_SHARE_ATTEMPT', { timestamp: Date.now() });
        return originalGetDisplayMedia.apply(this, args);
      };
    }
  }

  // Enhanced password strength checker
  checkPasswordStrength(password) {
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommonPatterns: !/123|abc|password|qwerty/i.test(password),
      noRepeating: !/(.)\1{2,}/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    return {
      score: score,
      maxScore: Object.keys(checks).length,
      strength: score < 4 ? 'weak' : score < 6 ? 'medium' : 'strong',
      checks: checks
    };
  }

  // Secure data encryption for local storage
  encryptData(data, key = 'default') {
    try {
      const jsonString = JSON.stringify(data);
      // Simple encryption - in production use proper crypto
      const encrypted = btoa(jsonString);
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  decryptData(encryptedData, key = 'default') {
    try {
      const decrypted = atob(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Secure local storage wrapper
  secureSetItem(key, value) {
    const encrypted = this.encryptData(value);
    if (encrypted) {
      localStorage.setItem(key, encrypted);
      this.logSecurityEvent('SECURE_STORAGE_SET', { key });
    }
  }

  secureGetItem(key) {
    const encrypted = localStorage.getItem(key);
    if (encrypted) {
      this.logSecurityEvent('SECURE_STORAGE_GET', { key });
      return this.decryptData(encrypted);
    }
    return null;
  }

  // Initialize additional security features
  initAdvancedSecurity() {
    this.detectVPN();
    this.detectSuspiciousExtensions();
    this.monitorClipboard();
    this.detectScreenRecording();
    
    // Initialize behavioral tracking if available
    if (window.SecurityUtils && this.config.FEATURES?.BEHAVIORAL_ANALYSIS) {
      this.behaviorTracker = SecurityUtils.initBehavioralTracking();
    }
    
    // Generate device fingerprint if available
    if (window.SecurityUtils && this.config.FEATURES?.DEVICE_FINGERPRINTING) {
      this.deviceFingerprint = SecurityUtils.generateDeviceFingerprint();
      this.logSecurityEvent('DEVICE_FINGERPRINT', { 
        fingerprint: this.deviceFingerprint.substring(0, 20) + '...' 
      });
    }
    
    // Set up periodic security checks
    setInterval(() => {
      this.performSecurityCheck();
    }, 60000); // Every minute
    
    // Set up behavioral analysis (every 5 minutes)
    if (this.behaviorTracker) {
      setInterval(() => {
        this.analyzeBehavior();
      }, 300000); // Every 5 minutes
    }
  }

  performSecurityCheck() {
    const checks = {
      sessionValid: this.validateUserSession(),
      noSuspiciousActivity: this.checkForSuspiciousActivity(),
      browserIntegrity: this.checkBrowserIntegrity()
    };
    
    this.logSecurityEvent('SECURITY_CHECK', checks);
    
    if (!checks.sessionValid || !checks.noSuspiciousActivity || !checks.browserIntegrity) {
      this.handleSecurityThreat();
    }
  }

  checkForSuspiciousActivity() {
    const securityLog = JSON.parse(localStorage.getItem('securityLog') || '[]');
    const recentEvents = securityLog.filter(event => 
      Date.now() - event.timestamp < 300000 // Last 5 minutes
    );
    
    // Check for rapid events
    const rapidEvents = recentEvents.filter(event => 
      ['FORM_SUBMIT', 'LOGIN_FAILED', 'RAPID_FORM_SUBMISSION'].includes(event.type)
    );
    
    return rapidEvents.length < 10; // Threshold for suspicious activity
  }

  checkBrowserIntegrity() {
    // Check if critical browser features are intact
    return !!(
      window.crypto &&
      window.localStorage &&
      window.sessionStorage &&
      document.createElement &&
      JSON.parse &&
      JSON.stringify
    );
  }

  handleSecurityThreat() {
    this.logSecurityEvent('SECURITY_THREAT_DETECTED', { 
      timestamp: Date.now(),
      userAgent: navigator.userAgent 
    });
    
    // In a real application, you might:
    // - Force logout
    // - Lock account temporarily
    // - Send alert to administrators
    // - Require additional authentication
    
    console.warn('Security threat detected - enhanced monitoring activated');
  }

  analyzeBehavior() {
    if (!this.behaviorTracker || !window.SecurityUtils) return;
    
    const analysis = SecurityUtils.analyzeBehavior(this.behaviorTracker);
    
    this.logSecurityEvent('BEHAVIOR_ANALYSIS', {
      isHuman: analysis.isHuman,
      confidence: analysis.confidence,
      flags: analysis.flags
    });
    
    if (!analysis.isHuman) {
      this.logSecurityEvent('BOT_DETECTED', analysis);
      this.handleSecurityThreat();
    }
  }

  // Enhanced input validation using SecurityUtils
  validateInput(input, type = 'general') {
    if (!window.SecurityUtils) {
      return { isValid: true, threats: [] };
    }
    
    const threats = [];
    
    if (SecurityUtils.detectSQLInjection(input)) {
      threats.push('SQL_INJECTION');
    }
    
    if (SecurityUtils.detectXSS(input)) {
      threats.push('XSS');
    }
    
    if (SecurityUtils.detectCommandInjection(input)) {
      threats.push('COMMAND_INJECTION');
    }
    
    if (threats.length > 0) {
      this.logSecurityEvent('MALICIOUS_INPUT_DETECTED', {
        input: input.substring(0, 100) + '...',
        threats: threats,
        type: type
      });
    }
    
    return {
      isValid: threats.length === 0,
      threats: threats
    };
  }
}

// Initialize security manager
const securityManager = new SecurityManager();

// Export for use in other scripts
window.securityManager = securityManager;