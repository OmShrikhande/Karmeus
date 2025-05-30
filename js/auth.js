// --- Authentication check and logout logic ---
function logout() {
    localStorage.removeItem('currentUserEmail');
    sessionStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUserEmailHash');
    window.location.href = './../index.html';
}

function getCurrentUserEmail() {
    return localStorage.getItem('currentUserEmail') || sessionStorage.getItem('currentUserEmail');
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
        window.location.href = "./../main.html";
    }
});