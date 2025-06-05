// ===== SECURITY UTILITIES =====

class SecurityUtils {
  
  // ===== DEVICE FINGERPRINTING =====
  static generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      canvas: canvas.toDataURL(),
      webgl: this.getWebGLFingerprint(),
      fonts: this.getAvailableFonts(),
      plugins: Array.from(navigator.plugins).map(p => p.name),
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null
    };
    
    return btoa(JSON.stringify(fingerprint));
  }
  
  static getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;
      
      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
      };
    } catch (e) {
      return null;
    }
  }
  
  static getAvailableFonts() {
    const testFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact'
    ];
    
    const availableFonts = [];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const h = document.getElementsByTagName('body')[0];
    
    const s = document.createElement('span');
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    const defaultWidth = {};
    const defaultHeight = {};
    
    for (const font of ['monospace', 'sans-serif', 'serif']) {
      s.style.fontFamily = font;
      h.appendChild(s);
      defaultWidth[font] = s.offsetWidth;
      defaultHeight[font] = s.offsetHeight;
      h.removeChild(s);
    }
    
    for (const font of testFonts) {
      let detected = false;
      for (const baseFont of ['monospace', 'sans-serif', 'serif']) {
        s.style.fontFamily = `${font}, ${baseFont}`;
        h.appendChild(s);
        const matched = (s.offsetWidth !== defaultWidth[baseFont] || 
                        s.offsetHeight !== defaultHeight[baseFont]);
        h.removeChild(s);
        detected = detected || matched;
      }
      if (detected) {
        availableFonts.push(font);
      }
    }
    
    return availableFonts;
  }
  
  // ===== BEHAVIORAL ANALYSIS =====
  static initBehavioralTracking() {
    const behavior = {
      mouseMovements: [],
      keystrokes: [],
      scrollPatterns: [],
      clickPatterns: [],
      startTime: Date.now()
    };
    
    // Track mouse movements
    document.addEventListener('mousemove', (e) => {
      behavior.mouseMovements.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now() - behavior.startTime
      });
      
      // Keep only last 100 movements
      if (behavior.mouseMovements.length > 100) {
        behavior.mouseMovements.shift();
      }
    });
    
    // Track keystrokes (timing only, not content)
    document.addEventListener('keydown', (e) => {
      behavior.keystrokes.push({
        key: e.key.length === 1 ? 'char' : e.key,
        timestamp: Date.now() - behavior.startTime,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey
      });
      
      if (behavior.keystrokes.length > 100) {
        behavior.keystrokes.shift();
      }
    });
    
    // Track scroll patterns
    document.addEventListener('scroll', () => {
      behavior.scrollPatterns.push({
        scrollY: window.scrollY,
        timestamp: Date.now() - behavior.startTime
      });
      
      if (behavior.scrollPatterns.length > 50) {
        behavior.scrollPatterns.shift();
      }
    });
    
    // Track click patterns
    document.addEventListener('click', (e) => {
      behavior.clickPatterns.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now() - behavior.startTime,
        target: e.target.tagName
      });
      
      if (behavior.clickPatterns.length > 50) {
        behavior.clickPatterns.shift();
      }
    });
    
    return behavior;
  }
  
  static analyzeBehavior(behavior) {
    const analysis = {
      isHuman: true,
      confidence: 0.5,
      flags: []
    };
    
    // Check mouse movement patterns
    if (behavior.mouseMovements.length > 10) {
      const movements = behavior.mouseMovements;
      const distances = [];
      
      for (let i = 1; i < movements.length; i++) {
        const dx = movements[i].x - movements[i-1].x;
        const dy = movements[i].y - movements[i-1].y;
        distances.push(Math.sqrt(dx*dx + dy*dy));
      }
      
      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
      const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
      
      // Too uniform movement might indicate bot
      if (variance < 10) {
        analysis.flags.push('uniform_mouse_movement');
        analysis.confidence -= 0.2;
      }
      
      // Too fast movement might indicate bot
      if (avgDistance > 100) {
        analysis.flags.push('fast_mouse_movement');
        analysis.confidence -= 0.1;
      }
    }
    
    // Check keystroke patterns
    if (behavior.keystrokes.length > 5) {
      const intervals = [];
      for (let i = 1; i < behavior.keystrokes.length; i++) {
        intervals.push(behavior.keystrokes[i].timestamp - behavior.keystrokes[i-1].timestamp);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      // Too fast typing might indicate bot
      if (avgInterval < 50) {
        analysis.flags.push('fast_typing');
        analysis.confidence -= 0.2;
      }
      
      // Too uniform typing might indicate bot
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      if (variance < 100) {
        analysis.flags.push('uniform_typing');
        analysis.confidence -= 0.1;
      }
    }
    
    analysis.isHuman = analysis.confidence > 0.3;
    return analysis;
  }
  
  // ===== THREAT DETECTION =====
  static detectSQLInjection(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\'|\"|;|--|\*|\|)/,
      /(\bOR\b|\bAND\b).*(\=|\<|\>)/i,
      /(script|javascript|vbscript|onload|onerror)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }
  
  static detectXSS(input) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[^>]*>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
  
  static detectCommandInjection(input) {
    const cmdPatterns = [
      /(\||&|;|\$\(|\`)/,
      /(rm|del|format|shutdown|reboot)/i,
      /(\.\.\/|\.\.\\)/,
      /(\/etc\/passwd|\/etc\/shadow|cmd\.exe|powershell)/i
    ];
    
    return cmdPatterns.some(pattern => pattern.test(input));
  }
  
  // ===== NETWORK SECURITY =====
  static async checkIPReputation(ip) {
    // This would typically call an external API
    // For demo purposes, we'll simulate the check
    const suspiciousIPs = [
      '192.168.1.100', // Example suspicious IP
      '10.0.0.50'
    ];
    
    return {
      isSuspicious: suspiciousIPs.includes(ip),
      reputation: suspiciousIPs.includes(ip) ? 'bad' : 'good',
      source: 'local_blacklist'
    };
  }
  
  static detectTorUsage() {
    // Basic Tor detection (not foolproof)
    const torIndicators = [
      navigator.userAgent.includes('Tor'),
      window.location.hostname.endsWith('.onion'),
      navigator.doNotTrack === '1' && navigator.cookieEnabled === false
    ];
    
    return torIndicators.some(indicator => indicator);
  }
  
  // ===== ENCRYPTION UTILITIES =====
  static async generateKeyPair() {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      return keyPair;
    } catch (error) {
      console.error('Key generation failed:', error);
      return null;
    }
  }
  
  static async encryptData(data, publicKey) {
    try {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        encodedData
      );
      
      return Array.from(new Uint8Array(encrypted));
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }
  
  static async decryptData(encryptedData, privateKey) {
    try {
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        new Uint8Array(encryptedData)
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }
  
  // ===== SECURE RANDOM GENERATION =====
  static generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  static generateNonce() {
    return this.generateSecureToken(16);
  }
  
  // ===== SECURITY VALIDATION =====
  static validateSecurityHeaders(response) {
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => 
      !response.headers.has(header)
    );
    
    return {
      isSecure: missingHeaders.length === 0,
      missingHeaders: missingHeaders
    };
  }
  
  static validateCSP(cspHeader) {
    const requiredDirectives = [
      'default-src',
      'script-src',
      'style-src',
      'img-src',
      'connect-src'
    ];
    
    const missingDirectives = requiredDirectives.filter(directive => 
      !cspHeader.includes(directive)
    );
    
    return {
      isValid: missingDirectives.length === 0,
      missingDirectives: missingDirectives
    };
  }
}

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUtils;
} else {
  window.SecurityUtils = SecurityUtils;
}