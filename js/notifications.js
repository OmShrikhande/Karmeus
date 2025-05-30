// --- Notification logic ---
function showTopNotification(message, type = "info") {
    let notif = document.getElementById('top-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'top-notification';
        notif.style.position = 'fixed';
        notif.style.top = '24px';
        notif.style.left = '50%';
        notif.style.transform = 'translateX(-50%)';
        notif.style.zIndex = '9999';
        notif.style.padding = '1em 2em';
        notif.style.borderRadius = '8px';
        notif.style.fontSize = '1.1em';
        notif.style.fontWeight = '600';
        notif.style.boxShadow = '0 4px 24px rgba(60,90,130,0.13)';
        notif.style.transition = 'opacity 0.4s';
        notif.style.opacity = '0';
        notif.style.pointerEvents = 'none';
        document.body.appendChild(notif);
    }
    notif.textContent = message;
    notif.style.background = type === "success" ? "#27ae60" : (type === "error" ? "#e74c3c" : "#232946");
    notif.style.color = "#fff";
    notif.style.opacity = '1';
    setTimeout(() => { notif.style.opacity = '0'; }, 2200);
}