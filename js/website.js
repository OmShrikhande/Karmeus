// --- Fetch website/company details ---
async function fetchWebsiteDetails() {
    try {
        const firestore = firebase.firestore();
        const abtWebsiteDoc = await firestore.collection("basicdetails ").doc("abtwesite").get();
        if (abtWebsiteDoc.exists) {
            const data = abtWebsiteDoc.data();
            if (data && data.name) {
                const siteTitle = document.querySelector('.site-title');
                if (siteTitle) siteTitle.textContent = data.name;
            }
            if (data && data.developer) {
                const devCredit = document.getElementById('developerCredit');
                if (devCredit) devCredit.textContent = `Developed by ${data.developer}`;
            }
        }
        const abtCompanyDoc = await firestore.collection("basicdetails ").doc("abtcomapny").get();
        if (abtCompanyDoc.exists) {
            const data = abtCompanyDoc.data();
            if (data && data.name) {
                const footer = document.querySelector('footer p');
                if (footer) footer.innerHTML = `&copy; 2025 ${data.name}. All rights reserved.<br><span id="developerCredit" style="font-size:1em; color:#666;">Developed by Om Shrikhande</span>`;
            }
        }
    } catch (err) {
        console.error("Error fetching website details:", err);
    }
}