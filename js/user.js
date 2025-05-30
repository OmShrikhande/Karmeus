// --- Fetch username from Firestore based on logged-in user email ---
async function fetchAndDisplayUsername() {
    const email = getCurrentUserEmail();
    const welcomeEls = document.querySelectorAll('#welcomeUser');
    if (!email) {
        welcomeEls.forEach(el => el.textContent = "Welcome!");
        return;
    }
    try {
        const userDoc = await firebase.firestore().collection("userdata").doc(email).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            welcomeEls.forEach(el => el.textContent = `Welcome, ${userData.username || userData.name || email}!`);
        } else {
            welcomeEls.forEach(el => el.textContent = "Welcome!");
        }
    } catch (err) {
        welcomeEls.forEach(el => el.textContent = "Welcome!");
    }
}