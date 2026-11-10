
const SUPABASE_URL = "https://udxotjgeuwklzlqvdrux.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lJmjV5s_B8X8J6ZEH9rKkA_NK0aFu8k";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

let isRegister = false;

const form = document.getElementById("authForm");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const switchMode = document.getElementById("switchMode");

const fullNameInput = document.getElementById("fullName");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

switchMode.addEventListener("click", () => {
    isRegister = !isRegister;

    fullNameInput.hidden = !isRegister;
    fullNameInput.required = isRegister;
    fullNameInput.style.display = isRegister ? "block" : "none";

    document.getElementById("subtitle").textContent =
        isRegister ? "Create your account" : "Login to your account";

    submitBtn.textContent = isRegister ? "Register" : "Login";

    switchMode.textContent = isRegister
        ? "Already have an account? Login"
        : "Don't have an account? Register";

    passwordInput.autocomplete = isRegister
        ? "new-password"
        : "current-password";

    message.textContent = "";
});

async function functionErrorMessage(error) {
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

    const fullName = fullNameInput.value.trim();
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

        if (isRegister) {
            if (fullName.length < 2) {
                throw new Error("Please enter your full name.");
            }

            if (password.length < 8) {
                throw new Error("Password must be at least 8 characters.");
            }

            const { data, error } = await db.functions.invoke(
                "register-user",
                {
                    body: { fullName, username, password }
                }
            );

            if (error) {
                throw new Error(await functionErrorMessage(error));
            }

            if (!data?.success) {
                throw new Error(data?.error || "Registration failed.");
            }

            message.textContent =
                "Account created! You can now log in.";

            isRegister = false;
            fullNameInput.hidden = true;
            fullNameInput.required = false;
            fullNameInput.style.display = "none";

            document.getElementById("subtitle").textContent =
                "Login to your account";

            submitBtn.textContent = "Login";
            switchMode.textContent =
                "Don't have an account? Register";

            passwordInput.value = "";
            fullNameInput.value = "";

        } else {
            const { data, error } = await db.functions.invoke(
                "login-monitor",
                {
                    body: { username, password }
                }
            );

            if (error) {
                throw new Error(await functionErrorMessage(error));
            }

            if (!data?.session) {
                throw new Error(data?.error || "Login failed.");
            }

            const { error: sessionError } =
                await db.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token
                });

            if (sessionError) throw sessionError;

            message.textContent = "Login successful!";
            window.location.href = "index.html";
        }

    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
    }
});
