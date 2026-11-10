
const SUPABASE_URL = "https://udxotjgeuwklzlqvdrux.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lJmjV5s_B8X8J6ZEH9rKk";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// USER ACCESS CHECK
async function loadUserDashboard() {
    const { data: { session }, error: sessionError } =
        await db.auth.getSession();

    if (sessionError || !session) {
        window.location.replace("login.html");
        return;
    }

    const { data: profile, error } = await db
        .from("profiles")
        .select("full_name, username, role")
        .eq("id", session.user.id)
        .single();

    if (error || !profile) {
        await db.auth.signOut({ scope: "local" });
        window.location.replace("login.html");
        return;
    }

    if (profile.role === "admin") {
        window.location.replace("index.html");
        return;
    }

    if (profile.role !== "user") {
        await db.auth.signOut({ scope: "local" });
        window.location.replace("login.html");
        return;
    }

    document.getElementById("fullName").textContent =
        profile.full_name || "Not available";

    document.getElementById("username").textContent =
        profile.username || "Not available";

    document.getElementById("role").textContent =
        profile.role;
}

// LOGOUT
async function logout() {
    const button = document.getElementById("logoutBtn");

    if (button) {
        button.disabled = true;
        button.textContent = "Logging out...";
    }

    const { error } = await db.auth.signOut({
        scope: "local"
    });

    if (error) {
        console.error("Logout error:", error);
        alert("Unable to logout. Please try again.");

        if (button) {
            button.disabled = false;
            button.textContent = "Logout";
        }

        return;
    }

    window.location.replace("login.html");
}

// START
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logoutBtn")
        ?.addEventListener("click", logout);

    loadUserDashboard();
});
