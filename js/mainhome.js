// --- Main entry point with security validation ---
document.addEventListener('DOMContentLoaded', () => {
    // Validate user session first (if security manager is available)
    if (window.securityManager) {
        if (!window.securityManager.validateUserSession()) {
            console.log('Invalid session, redirecting to login');
            return; // validateUserSession handles redirect
        }
        
        // Log page access
        const userEmail = localStorage.getItem('currentUserEmail');
        window.securityManager.logSecurityEvent('PAGE_ACCESS', { 
            page: 'home', 
            email: userEmail 
        });
    } else {
        // Basic session check without security manager
        const userEmail = localStorage.getItem('currentUserEmail');
        if (!userEmail) {
            console.log('No user session found, redirecting to login');
            window.location.href = '../index.html';
            return;
        }
    }
    
    fetchAndDisplayUsername();
    renderDevices();
    fetchWebsiteDetails();
});