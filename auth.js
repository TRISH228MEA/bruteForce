
const SUPABASE_URL = "https://udxotjgeuwklzlqvdrux.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lJmjV5s_B8X8J6ZEH9rKk";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const form = document.getElementById("authForm");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

usernameInput.addEventListener("input", () => {
    usernameInput.value = usernameInput.value.replace(/\s/g, "");
});

async function getErrorMessage(error) {
    try {
        if (error.context instanceof Response) {
            const result = await error.context.clone().json();
            if (result.error) return result.error;
        }
    } catch {}

    return error.message || "Something went wrong.";
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    submitBtn.disabled = true;
    message.textContent = "Please wait...";

    try {
        if (!/^[a-z0-9_]{3,30}$/.test(username)) {
            throw new Error(
                "Username must be 3-30 characters using letters, numbers, or underscores."
            );
        }

        const { data, error } = await db.functions.invoke(
            "login-monitor",
            {
                body: { username, password }
            }
        );

        if (error) {
            throw new Error(await getErrorMessage(error));
        }

        if (!data?.session) {
            throw new Error(data?.error || "Login failed.");
        }

        const { error: sessionError } = await db.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
        });

        if (sessionError) throw sessionError;

        const { data: { session } } = await db.auth.getSession();

        const { data: profile, error: profileError } = await db
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (profileError || !profile) {
            await db.auth.signOut();
            throw new Error("Unable to verify account role.");
        }

        if (profile.role === "admin") {
            window.location.href = "index.html";
        } else if (profile.role === "user") {
            window.location.href = "user.html";
        } else {
            await db.auth.signOut();
            throw new Error("Invalid account role.");
        }

    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
    }
});
