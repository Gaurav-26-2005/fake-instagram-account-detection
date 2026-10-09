let analysisHistory = [];
let currentAnalysis = {};
let map = null;
let marker = null;

// Core Calculation Function
function calculateRisk(followers, following, posts) {
    let riskScore = 0;
    let reasons = [];

    if (following > 0 && (followers / following) < 0.1) {
        riskScore += 40;
        reasons.push("Follows significantly more accounts than followers (Low Follower/Following ratio).");
    }

    if (posts === 0) {
        riskScore += 35;
        reasons.push("Account has zero posts published.");
    } else if (posts < 3) {
        riskScore += 15;
        reasons.push("Very low post activity (fewer than 3 posts).");
    }

    if (following > 500 && followers < 50) {
        riskScore += 25;
        reasons.push("Suspicious mass-following behavior pattern detected.");
    }

    return {
        score: Math.min(riskScore, 100),
        reasons: reasons
    };
}

// Single Account Analysis Submit Handler
document.getElementById('analyzerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.replace('@', '');
    const followers = parseInt(document.getElementById('followers').value) || 0;
    const following = parseInt(document.getElementById('following').value) || 0;
    const posts = parseInt(document.getElementById('posts').value) || 0;

    const result = calculateRisk(followers, following, posts);
    const riskScore = result.score;
    const reasons = result.reasons;

    currentAnalysis = { username, followers, following, posts, riskScore, reasons };

    const resultsSection = document.getElementById('resultsSection');
    const riskDiv = document.getElementById('riskScore');
    const explanationDiv = document.getElementById('explanation');

    resultsSection.style.display = 'block';

    // Dynamic Gen Z Color Badges
    const scoreClass = riskScore >= 70 ? 'badge-high' : (riskScore >= 35 ? 'badge-medium' : 'badge-low');
    const scoreText = riskScore >= 70 ? 'High Risk / Bot' : (riskScore >= 35 ? 'Suspect Profile' : 'Low Risk / Genuine');

    riskDiv.innerHTML = `<span class="score-badge ${scoreClass}">${riskScore} / 100 — ${scoreText}</span>`;

    if (reasons.length > 0) {
        explanationDiv.innerHTML = "<h4>Triggered Flags:</h4><div class='flag-list'>" +
            reasons.map(r => `<div class='flag-pill'>🚨 ${r}</div>`).join('') + "</div>";
    } else {
        explanationDiv.innerHTML = "<p style='color:#00f5d4; font-weight:600;'>✅ No suspicious patterns detected based on rule set.</p>";
    }

    // Render Esri Interactive Map
    renderMap(40.7128, -74.0060, username);

    // Update Detection History
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    analysisHistory.unshift({ username, riskScore, timestamp });
    updateHistoryUI();
});

// Render Interactive Map using Esri Tiles (Prevents 403 Access Blocked)
function renderMap(lat, lng, username) {
    if (!map) {
        map = L.map('map').setView([lat, lng], 10);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        }).addTo(map);
    } else {
        map.setView([lat, lng], 10);
    }

    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`Sample Location: @${username}`)
        .openPopup();

    setTimeout(() => { map.invalidateSize(); }, 200);
}

// Update History List
function updateHistoryUI() {
    const historyList = document.getElementById('historyList');
    if (analysisHistory.length === 0) {
        historyList.innerHTML = `<p class="empty-msg">No previous analyses logged.</p>`;
        return;
    }

    historyList.innerHTML = analysisHistory.map(item => `
        <li>
            <span><strong>@${item.username}</strong> — Risk: ${item.riskScore}/100</span>
            <span style="color: #64748b;">${item.timestamp}</span>
        </li>
    `).join('');
}

// Download PDF Handler with Embedded Static Map Snapshot
document.getElementById('downloadPdfBtn').addEventListener('click', function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Fake Instagram Account Analysis Report", 10, 20);

    doc.setFontSize(12);
    doc.text(`Username: @${currentAnalysis.username}`, 10, 35);
    doc.text(`Followers: ${currentAnalysis.followers}`, 10, 43);
    doc.text(`Following: ${currentAnalysis.following}`, 10, 51);
    doc.text(`Posts: ${currentAnalysis.posts}`, 10, 59);

    doc.text(`Risk Score: ${currentAnalysis.riskScore} / 100`, 10, 72);

    doc.text("Triggered Flags:", 10, 85);
    let currentY = 95;
    if (currentAnalysis.reasons && currentAnalysis.reasons.length > 0) {
        currentAnalysis.reasons.forEach((reason) => {
            doc.text(`- ${reason}`, 15, currentY);
            currentY += 8;
        });
    } else {
        doc.text("- No flags triggered.", 15, currentY);
        currentY += 8;
    }

    doc.text("Location Tracking Snapshot:", 10, currentY + 10);

    // Static Map Snapshot to bypass CORS issues on PDF generation
    const mapImg = new Image();
    mapImg.crossOrigin = "Anonymous";
    mapImg.src = "https://static-maps.yandex.ru/1.x/?lang=en_US&ll=-74.0060,40.7128&z=10&l=map&pt=-74.0060,40.7128,pm2rdm&size=450,200";

    mapImg.onload = function () {
        doc.addImage(mapImg, 'PNG', 10, currentY + 15, 130, 60);
        currentY += 85;

        doc.setFontSize(9);
        doc.text("Disclaimer: Location and metadata reflect sample benchmark data and non-verified user inputs.", 10, currentY + 10);
        doc.save(`${currentAnalysis.username}_Analysis_Report.pdf`);
    };

    mapImg.onerror = function () {
        doc.setFontSize(9);
        doc.text("Disclaimer: Location and metadata reflect sample benchmark data and non-verified user inputs.", 10, currentY + 15);
        doc.save(`${currentAnalysis.username}_Analysis_Report.pdf`);
    };
});

// Account Comparison Handler
document.getElementById('compareBtn').addEventListener('click', function () {
    const uA = document.getElementById('userA').value || 'Account A';
    const folA = parseInt(document.getElementById('followersA').value) || 0;
    const fingA = parseInt(document.getElementById('followingA').value) || 0;
    const pA = parseInt(document.getElementById('postsA').value) || 0;

    const uB = document.getElementById('userB').value || 'Account B';
    const folB = parseInt(document.getElementById('followersB').value) || 0;
    const fingB = parseInt(document.getElementById('followingB').value) || 0;
    const pB = parseInt(document.getElementById('postsB').value) || 0;

    const scoreA = calculateRisk(folA, fingA, pA).score;
    const scoreB = calculateRisk(folB, fingB, pB).score;

    document.getElementById('thUserA').innerText = `@${uA.replace('@', '')}`;
    document.getElementById('thUserB').innerText = `@${uB.replace('@', '')}`;

    document.getElementById('resFolA').innerText = folA;
    document.getElementById('resFolB').innerText = folB;

    document.getElementById('resFingA').innerText = fingA;
    document.getElementById('resFingB').innerText = fingB;

    document.getElementById('resPostsA').innerText = pA;
    document.getElementById('resPostsB').innerText = pB;

    document.getElementById('resRiskA').innerText = `${scoreA} / 100`;
    document.getElementById('resRiskB').innerText = `${scoreB} / 100`;

    document.getElementById('comparisonResults').style.display = 'block';
});