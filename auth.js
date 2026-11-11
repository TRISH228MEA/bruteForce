
const SUPABASE_URL = "https://udxotjgeuwklzlqvdrux.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lJmjV5s_B8X8J6ZEH9rKkA_NK0aFu8k";


// ==========================================
// ACCESSGUARD - AUTHENTICATION SYSTEM
// ==========================================



const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

let isRegister = false;

// ==========================================
// HTML ELEMENTS
// ==========================================

const form = document.getElementById("authForm");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const switchMode = document.getElementById("switchMode");

const fullNameInput = document.getElementById("fullName");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

// ==========================================
// USERNAME INPUT
// ==========================================

usernameInput.addEventListener("input", () => {
    usernameInput.value = usernameInput.value.replace(/\s/g, "");
});

// ==========================================
// VALIDATE USERNAME OR EMAIL
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

    document.getElementById("subtitle").textContent =
        isRegister
            ? "Create your account"
            : "Login to your account";

    submitBtn.textContent =
        isRegister ? "Register" : "Login";

    switchMode.textContent =
        isRegister
            ? "Already have an account? Login"
            : "Don't have an account? Register";

    passwordInput.autocomplete =
        isRegister ? "new-password" : "current-password";

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

    } catch {}

    return error.message || "Something went wrong.";

}

// ==========================================
// AUTHENTICATION FORM
// ==========================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const fullName = fullNameInput.value.trim();

    const username =
        usernameInput.value.trim().toLowerCase();

    const password = passwordInput.value;

    submitBtn.disabled = true;
    message.textContent = "Please wait...";

    try {

        // ==================================
        // USERNAME / EMAIL VALIDATION
        // ==================================

        if (!validateUsernameOrEmail(username)) {

            throw new Error(
                "Enter a valid username or email address."
            );

        }

        // ==================================
        // REGISTRATION
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

                console.error(
                    "REGISTRATION ERROR:",
                    error
                );

                throw new Error(
                    await getErrorMessage(error)
                );

            }

            if (!data?.success) {

                throw new Error(
                    data?.error || "Registration failed."
                );

            }

            // REGISTRATION SUCCESS

            message.style.color = "#22c55e";

            message.textContent =
                "Account created! You can now log in.";

            isRegister = false;

            fullNameInput.hidden = true;
            fullNameInput.required = false;
            fullNameInput.style.display = "none";
            fullNameInput.value = "";

            passwordInput.value = "";

            document.getElementById("subtitle").textContent =
                "Login to your account";

            submitBtn.textContent = "Login";

            switchMode.textContent =
                "Don't have an account? Register";

        }

        // ==================================
        // LOGIN
        // ==================================

        else {

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

                console.error(
                    "LOGIN ERROR:",
                    error
                );

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
            // SET SUPABASE SESSION
            // ==================================

            const { error: sessionError } =
                await db.auth.setSession({

                    access_token:
                        data.session.access_token,

                    refresh_token:
                        data.session.refresh_token

                });

            if (sessionError) {
                throw sessionError;
            }

            // ==================================
            // GET CURRENT SESSION
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
            // GET ACCOUNT ROLE
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
            // REDIRECT BASED ON ROLE
            // ==================================

            if (profile.role === "admin") {

                window.location.href = "index.html";

            }

            else if (profile.role === "user") {

                window.location.href = "user.html";

            }

            else {

                await db.auth.signOut();

                throw new Error(
                    "Invalid account role."
                );

            }

        }

    }

    catch (error) {

        console.error(error);

        message.style.color = "#f87171";

        message.textContent = error.message;

    }

    finally {

        submitBtn.disabled = false;

    }

});
 document.getElementById("submitBtn");
const switchMode = document.getElementById("switchMode");

const fullNameInput = document.getElementById("fullName");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

usernameInput.addEventListener("input", () => {
    usernameInput.value = usernameInput.value.replace(/\s/g, "");
});

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
    console.error("EDGE FUNCTION ERROR:", error);

    const details = await getErrorMessage(error);

    throw new Error(details);
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
            fullNameInput.value = "";
            passwordInput.value = "";

            document.getElementById("subtitle").textContent =
                "Login to your account";

            submitBtn.textContent = "Login";
            switchMode.textContent =
                "Don't have an account? Register";

        } else {
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
        }

    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
    }
});
