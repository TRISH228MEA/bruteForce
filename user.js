
const SUPABASE_URL = "https://udxotjgeuwklzlqvdrux.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lJmjV5s_B8X8J6ZEH9rKk";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

async function loadUserDashboard() {
    const { data: { session }, error: sessionError } =
        await db.auth.getSession();

    if (sessionError || !session) {
        window.location.href = "login.html";
        return;
    }

    const { data: profile, error } = await db
        .from("profiles")
        .select("full_name, username, role")
        .eq("id", session.user.id)
        .single();

    if (error || !profile) {
        alert("Unable to load your account.");
        await db.auth.signOut();
        window.location.href = "login.html";
        return;
    }

    if (profile.role === "admin") {
        window.location.href = "index.html";
        return;
    }

    if (profile.role !== "user") {
        await db.auth.signOut();
        window.location.href = "login.html";
        return;
    }

    document.getElementById("fullName").textContent =
        profile.full_name || "Not available";

    document.getElementById("username").textContent =
        profile.username || "Not available";

    document.getElementById("role").textContent =
        profile.role;
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
    await db.auth.signOut();
    window.location.href = "login.html";
});

loadUserDashboard();
