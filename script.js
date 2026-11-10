
// SUPABASE CONNECTION
const SUPABASE_URL = "https://udxotjgeuwklzlqvdrux.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lJmjV5s_B8X8J6ZEH9rKkA_NK0aFu8k";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// MAP INITIALIZATION
const map = L.map("mapPlaceholder").setView([12.8797, 121.7740], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);

// ADMIN ACCESS CHECK
async function checkAdminAccess() {
    const { data: { session }, error: sessionError } =
        await db.auth.getSession();

    if (sessionError || !session) {
        window.location.href = "login.html";
        return false;
    }

    const { data: profile, error } = await db
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if (error || profile?.role !== "admin") {
        await db.auth.signOut();
        alert("Access denied. Admin only.");
        window.location.href = "login.html";
        return false;
    }

    return true;
}

// LOAD DASHBOARD
async function loadDashboard() {
    const { data: attempts, error } = await db
        .from("login_attempts")
        .select("*")
        .order("attempted_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("Login attempts error:", error);
        document.getElementById("attemptsTable").textContent =
            "Unable to load records. Check Supabase permissions.";
        return;
    }

    const records = attempts || [];

    document.getElementById("totalAttempts").textContent =
        records.length;

    document.getElementById("failedAttempts").textContent =
        records.filter(a => a.status === "failed").length;

    document.getElementById("successfulAttempts").textContent =
        records.filter(a => a.status === "success").length;

    const table = document.getElementById("attemptsTable");
    table.replaceChildren();

    if (records.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = "No login records found.";
        row.appendChild(cell);
        table.appendChild(row);
    }

    records.forEach(a => {
        const row = document.createElement("tr");

        const values = [
            a.full_name || a.username,
            a.ip_address,
            a.browser,
            [a.city, a.region, a.country]
                .filter(Boolean).join(", "),
            a.status,
            a.attempted_at
                ? new Date(a.attempted_at).toLocaleString()
                : ""
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value || "Unknown";
            row.appendChild(cell);
        });

        table.appendChild(row);
    });

    await loadSuspiciousIPs();
    await loadBlockedIPs();

    addLoginMarkers(records);
}

// LOAD SUSPICIOUS IPs
async function loadSuspiciousIPs() {
    const container = document.getElementById("suspiciousList");

    const { data, error } = await db
        .from("suspicious_ips")
        .select("*");

    if (error) {
        console.error("Suspicious IP error:", error);
        container.textContent = "Unable to load suspicious IP records.";
        return;
    }

    container.replaceChildren();

    if (!data || data.length === 0) {
        container.textContent = "No suspicious IP addresses found.";
        return;
    }

    data.forEach(ip => {
        const item = document.createElement("div");
        item.className = "suspicious-item";

        const title = document.createElement("strong");
        title.textContent = ip.ip_address || "Unknown IP";

        const details = document.createElement("p");
        details.textContent =
            "Failed attempts: " + (ip.failed_attempts || 0);

        item.append(title, details);
        container.appendChild(item);
    });
}

// LOAD BLOCKED IPs
async function loadBlockedIPs() {
    const { data, error } = await db
        .from("ip_blocks")
        .select("id");

    if (error) {
        console.error("Blocked IP error:", error);
        document.getElementById("blockedCount").textContent = "—";
        return;
    }

    document.getElementById("blockedCount").textContent =
        data.length;
}

// MAP MARKERS
function addLoginMarkers(records) {
    markerLayer.clearLayers();

    records.forEach(record => {
        const latitude = Number(record.latitude);
        const longitude = Number(record.longitude);

        if (
            record.latitude !== null &&
            record.longitude !== null &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
        ) {
            L.marker([latitude, longitude])
                .addTo(markerLayer)
                .bindPopup(`
                    <b>IP:</b> ${escapeHTML(record.ip_address || "Unknown")}<br>
                    <b>Location:</b> ${escapeHTML(
                        [record.city, record.region, record.country]
                            .filter(Boolean).join(", ") || "Unknown"
                    )}<br>
                    <b>Status:</b> ${escapeHTML(record.status || "Unknown")}
                `);
        }
    });
}

// ESCAPE HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// START DASHBOARD ONLY IF ADMIN
(async function startDashboard() {
    const allowed = await checkAdminAccess();

    if (allowed) {
        await loadDashboard();
    }
})();
