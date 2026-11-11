
// ==========================================
// ACCESSGUARD AUTHENTICATION SYSTEM
// ==========================================

const SUPABASE_URL = "https://udxotjgeuwklzlqvdrux.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_lJmjV5s_B8X8J6ZEH9rKkA_NK0aFu8k";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ==========================================
// ELEMENTS
// ==========================================

let isRegister = false;

const form = document.getElementById("authForm");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const switchMode = document.getElementById("switchMode");

const fullNameInput = document.getElementById("fullName");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

// ==========================================
// INITIAL SETTINGS
// ==========================================

fullNameInput.hidden = true;
fullNameInput.required = false;
fullNameInput.style.display = "none";

// ==========================================
// USERNAME INPUT
// ==========================================

usernameInput.addEventListener("input", () => {
    usernameInput.value =
        usernameInput.value.replace(/\s/g, "");
});

// ==========================================
// VALIDATION
// ==========================================

function validateUsernameOrEmail(value) {

    const username = value.trim().toLowerCase();

    const isUsername =
        /^[a-z0-9_]{3,30}$/.test(username);

    const isEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);

    return isUsername || isEmail;
}

// ==========================================
// SWITCH LOGIN / REGISTER
// ==========================================

switchMode.addEventListener("click", () => {

    isRegister = !isRegister;

    fullNameInput.hidden = !isRegister;
    fullNameInput.required = isRegister;

    fullNameInput.style.display =
        isRegister ? "block" : "none";

    document.getElementById("formTitle").textContent =
        isRegister ? "Create Account" : "Welcome Back";

    document.getElementById("subtitle").textContent =
        isRegister
            ? "Create your AccessGuard account"
            : "Login to your account";

    submitBtn.textContent =
        isRegister ? "Register" : "Login";

    switchMode.textContent =
        isRegister
            ? "Already have an account? Login"
            : "Don't have an account? Register";

    passwordInput.autocomplete =
        isRegister ? "new-password" : "current-password";

    usernameInput.placeholder = "Username or Email";

    message.textContent = "";

});

// ==========================================
// ERROR HANDLER
// ==========================================

async function getErrorMessage(error) {

    try {

        if (error.context instanceof Response) {

            const result =
                await error.context.clone().json();

            if (result.error) {
                return result.error;
            }
        }

    } catch (e) {
        console.error("Error reading response:", e);
    }

    return error.message || "Something went wrong.";
}

// ==========================================
// AUTHENTICATION
// ==========================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const fullName = fullNameInput.value.trim();

    const username =
        usernameInput.value.trim().toLowerCase();

    const password = passwordInput.value;

    message.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait...";

    try {

        // ==================================
        // VALIDATE USERNAME OR EMAIL
        // ==================================

        if (!validateUsernameOrEmail(username)) {

            throw new Error(
                "Enter a valid username or email address."
            );
        }

        // ==================================
        // REGISTER
        // ==================================

        if (isRegister) {

            if (fullName.length < 2) {
                throw new Error(
                    "Please enter your full name."
                );
            }

            if (password.length < 8) {
                throw new Error(
                    "Password must be at least 8 characters."
                );
            }

            const { data, error } =
                await db.functions.invoke(
                    "register-user",
                    {
                        body: {
                            fullName,
                            username,
                            password
                        }
                    }
                );

            if (error) {

                console.error("REGISTER ERROR:", error);

                throw new Error(
                    await getErrorMessage(error)
                );
            }

            if (!data?.success) {

                throw new Error(
                    data?.error || "Registration failed."
                );
            }

            message.style.color = "#22c55e";

            message.textContent =
                "Account created successfully! You can now log in.";

            isRegister = false;

            fullNameInput.value = "";
            fullNameInput.hidden = true;
            fullNameInput.required = false;
            fullNameInput.style.display = "none";

            passwordInput.value = "";

            document.getElementById("formTitle").textContent =
                "Welcome Back";

            document.getElementById("subtitle").textContent =
                "Login to your account";

            submitBtn.textContent = "Login";

            switchMode.textContent =
                "Don't have an account? Register";

            return;
        }

        // ==================================
        // LOGIN
        // ==================================

        const { data, error } =
            await db.functions.invoke(
                "login-monitor",
                {
                    body: {
                        username,
                        password
                    }
                }
            );

        if (error) {

            console.error("LOGIN ERROR:", error);

            throw new Error(
                await getErrorMessage(error)
            );
        }

        if (!data?.session) {

            throw new Error(
                data?.error || "Login failed."
            );
        }

        // ==================================
        // SET SESSION
        // ==================================

        const { error: sessionError } =
            await db.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
            });

        if (sessionError) {
            throw sessionError;
        }

        // ==================================
        // GET SESSION
        // ==================================

        const {
            data: { session }
        } = await db.auth.getSession();

        if (!session) {
            throw new Error(
                "Unable to verify login session."
            );
        }

        // ==================================
        // GET USER ROLE
        // ==================================

        const {
            data: profile,
            error: profileError
        } = await db
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (profileError || !profile) {

            await db.auth.signOut();

            throw new Error(
                "Unable to verify account role."
            );
        }

        // ==================================
        // REDIRECT
        // ==================================

        if (profile.role === "admin") {

            window.location.href = "index.html";

        } else if (profile.role === "user") {

            window.location.href = "user.html";

        } else {

            await db.auth.signOut();

            throw new Error(
                "Invalid account role."
            );
        }

    } catch (error) {

        console.error("AUTHENTICATION ERROR:", error);

        message.style.color = "#f87171";
        message.textContent = error.message;

    } finally {

        submitBtn.disabled = false;

        if (isRegister) {
            submitBtn.textContent = "Register";
        } else {
            submitBtn.textContent = "Login";
        }
    }

});
