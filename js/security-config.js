// ===== SECURITY CONFIGURATION =====

const SECURITY_CONFIG = {
  // Session settings
  SESSION: {
    TIMEOUT: 30 * 60 * 1000, // 30 minutes
    ACTIVITY_TIMEOUT: 5 * 60 * 1000, // 5 minutes of inactivity
    MAX_CONCURRENT_SESSIONS: 3,
    SECURE_COOKIES: true
  },

  // Login security
  LOGIN: {
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    PASSWORD_MIN_LENGTH: 8,
    REQUIRE_2FA: false, // Set to true for production
    CAPTCHA_AFTER_ATTEMPTS: 3
  },

  // Rate limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    LOGIN_ATTEMPTS_PER_MINUTE: 5,
    FORM_SUBMISSIONS_PER_MINUTE: 10,
    API_CALLS_PER_MINUTE: 100
  },

  // Content Security Policy
  CSP: {
    ENABLED: true,
    REPORT_ONLY: false,
    DIRECTIVES: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        "https://www.gstatic.com",
        "https://*.firebaseio.com",
        "https://*.googleapis.com"
      ],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "https:"],
      'connect-src': [
        "'self'",
        "https://*.firebaseio.com",
        "https://*.googleapis.com",
        "https://firestore.googleapis.com",
        "https://firebase.googleapis.com",
        "wss://*.firebaseio.com"
      ],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'frame-src': ["https://*.firebaseio.com"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
  },

  // Input validation
  INPUT_VALIDATION: {
    SANITIZE_ON_INPUT: true,
    BLOCK_DANGEROUS_PATTERNS: true,
    MAX_INPUT_LENGTH: 10000,
    ALLOWED_FILE_TYPES: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'],
    MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
  },

  // Monitoring
  MONITORING: {
    LOG_ALL_EVENTS: true,
    LOG_RETENTION_DAYS: 30,
    ALERT_ON_SUSPICIOUS_ACTIVITY: true,
    TRACK_USER_BEHAVIOR: true,
    DETECT_BOT_ACTIVITY: true
  },

  // Encryption
  ENCRYPTION: {
    ALGORITHM: 'AES-GCM',
    KEY_LENGTH: 256,
    ENCRYPT_LOCAL_STORAGE: true,
    ENCRYPT_SESSION_STORAGE: true
  },

  // Security headers
  HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  },

  // Feature flags
  FEATURES: {
    ADVANCED_THREAT_DETECTION: true,
    BEHAVIORAL_ANALYSIS: true,
    DEVICE_FINGERPRINTING: true,
    CLIPBOARD_MONITORING: true,
    SCREEN_RECORDING_DETECTION: true,
    VPN_DETECTION: false, // Requires external service
    GEOLOCATION_TRACKING: false // Privacy consideration
  },

  // Alerts and notifications
  ALERTS: {
    FAILED_LOGIN_THRESHOLD: 3,
    SUSPICIOUS_ACTIVITY_THRESHOLD: 5,
    NOTIFY_ADMIN_ON_THREATS: true,
    EMAIL_ALERTS: false, // Requires email service
    SMS_ALERTS: false // Requires SMS service
  }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SECURITY_CONFIG;
} else {
  window.SECURITY_CONFIG = SECURITY_CONFIG;
}