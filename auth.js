/* =========================================================
   ALBUM TABLIC — SUPABASE AUTH 4.0
   Logowanie, rejestracja, reset hasła i ochrona albumu
   ========================================================= */
(function () {
    "use strict";

    const PROJECT_URL = "https://ddlwmtbtsaikbkorkwaa.supabase.co";
    const PUBLISHABLE_KEY = "sb_publishable_i9lPlpSiRH5wLzI8QJ_gcA_-n0IZNL2";

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        console.error("Nie załadował się klient Supabase.");
        return;
    }

    const client = window.supabase.createClient(PROJECT_URL, PUBLISHABLE_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });

    let cachedUser = null;
    let sessionPromise = null;
    let passwordRecoveryMode = false;

    async function requireSession() {
        if (cachedUser) return cachedUser;
        if (sessionPromise) return sessionPromise;

        sessionPromise = (async function () {
            const { data, error } = await client.auth.getSession();

            if (error || !data.session) {
                window.location.replace("./index.html?auth=required");
                return null;
            }

            const { data: userData, error: userError } = await client.auth.getUser();

            if (userError || !userData.user) {
                await client.auth.signOut({ scope: "local" });
                window.location.replace("./index.html?auth=required");
                return null;
            }

            cachedUser = userData.user;
            return cachedUser;
        })();

        try {
            return await sessionPromise;
        } finally {
            sessionPromise = null;
        }
    }

    window.albumAuth = {
        client: client,
        requireSession: requireSession,
        get currentUser() {
            return cachedUser;
        }
    };

    function setStatus(message, state) {
        const status = document.getElementById("cover-auth-status");
        if (!status) return;
        status.textContent = message;
        status.dataset.state = state || "";
    }

    function setBusy(buttons, busy, busyText) {
        buttons.forEach(function (button) {
            if (!button) return;
            if (busy) {
                if (!button.disabled) button.dataset.originalText = button.textContent;
                button.textContent = busyText || "CHWILA...";
                button.disabled = true;
            } else {
                button.textContent = button.dataset.originalText || button.textContent;
                button.disabled = false;
            }
        });
    }

    function showLoggedIn(user) {
        const form = document.getElementById("cover-auth-form");
        const loggedIn = document.getElementById("cover-auth-logged-in");
        const userLabel = document.getElementById("cover-auth-user");
        const openAlbum = document.getElementById("open-album-button");
        const recovery = document.getElementById("cover-auth-recovery");

        if (form) form.hidden = true;
        if (recovery) recovery.hidden = true;
        if (loggedIn) loggedIn.hidden = false;
        if (userLabel) userLabel.textContent = "ZALOGOWANO: " + (user.email || "konto kolekcjonera");
        if (openAlbum) openAlbum.hidden = false;
        setStatus("Twoja kolekcja jest gotowa.", "success");
    }

    function showLoggedOut() {
        const form = document.getElementById("cover-auth-form");
        const loggedIn = document.getElementById("cover-auth-logged-in");
        const openAlbum = document.getElementById("open-album-button");
        const recovery = document.getElementById("cover-auth-recovery");

        if (form) form.hidden = false;
        if (loggedIn) loggedIn.hidden = true;
        if (openAlbum) openAlbum.hidden = true;
        if (recovery) recovery.hidden = true;
    }

    async function initializeIndexAuth() {
        const form = document.getElementById("cover-auth-form");
        if (!form) return;

        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");
        const signupUsernameInput = document.getElementById("signup-username");
        const signupPasswordInput = document.getElementById("signup-password");
        const signupPasswordConfirmInput = document.getElementById("signup-password-confirm");
        const loginFields = document.getElementById("login-fields");
        const signupFields = document.getElementById("signup-fields");
        const loginButton = document.getElementById("login-submit");
        const signupButton = document.getElementById("signup-submit");
        const signupCreateButton = document.getElementById("signup-create");
        const signupCancelButton = document.getElementById("signup-cancel");
        const forgotButton = document.getElementById("forgot-password");
        const logoutButton = document.getElementById("logout-submit");
        const recoveryBox = document.getElementById("cover-auth-recovery");
        const newPasswordInput = document.getElementById("new-password");
        const savePasswordButton = document.getElementById("save-new-password");

        const { data, error } = await client.auth.getSession();

        if (passwordRecoveryMode) {
            form.hidden = true;
            if (recoveryBox) recoveryBox.hidden = false;
            setStatus("Ustaw nowe hasło do swojego konta.", "success");
        } else if (!error && data.session && data.session.user) {
            cachedUser = data.session.user;
            showLoggedIn(cachedUser);
        } else {
            showLoggedOut();
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            loginButton.click();
        });

        loginButton.addEventListener("click", async function () {
            const identifier = emailInput.value.trim();
            const password = passwordInput.value;
            const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

            if (!identifier || !password) {
                setStatus("Wpisz e-mail lub login oraz hasło.", "error");
                return;
            }

            setBusy([loginButton, signupButton, forgotButton], true, "LOGOWANIE...");
            let result;

            try {
                if (looksLikeEmail) {
                    result = await client.auth.signInWithPassword({
                        email: identifier,
                        password: password
                    });
                } else {
                    const response = await fetch(PROJECT_URL + "/functions/v1/login-with-username", {
                        method: "POST",
                        headers: {
                            "apikey": PUBLISHABLE_KEY,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ username: identifier, password: password })
                    });
                    const payload = await response.json().catch(function () { return {}; });

                    if (!response.ok || !payload.access_token || !payload.refresh_token) {
                        throw new Error("Nieprawidłowy login lub hasło.");
                    }

                    result = await client.auth.setSession({
                        access_token: payload.access_token,
                        refresh_token: payload.refresh_token
                    });
                }
            } catch (error) {
                setBusy([loginButton, signupButton, forgotButton], false);
                setStatus("Nie udało się zalogować: " + (error.message || "spróbuj ponownie."), "error");
                return;
            }

            setBusy([loginButton, signupButton, forgotButton], false);

            if (result.error || !result.data || !result.data.user) {
                setStatus("Nie udało się zalogować: " + (result.error?.message || "Nieprawidłowy login lub hasło."), "error");
                return;
            }

            cachedUser = result.data.user;
            window.location.href = "./album.html";
        });

        signupButton.addEventListener("click", function () {
            const email = emailInput.value.trim();
            if (!email) {
                setStatus("Najpierw wpisz adres e-mail.", "error");
                emailInput.focus();
                return;
            }
            loginFields.hidden = true;
            signupFields.hidden = false;
            passwordInput.value = "";
            signupUsernameInput.value = "";
            signupPasswordInput.value = "";
            signupPasswordConfirmInput.value = "";
            signupUsernameInput.focus();
            setStatus("Wybierz własne hasło do nowego konta.", "success");
        });

        signupCancelButton.addEventListener("click", function () {
            signupFields.hidden = true;
            loginFields.hidden = false;
            signupUsernameInput.value = "";
            signupPasswordInput.value = "";
            signupPasswordConfirmInput.value = "";
            setStatus("Możesz się zalogować lub rozpocząć rejestrację.", "");
        });

        signupCreateButton.addEventListener("click", async function () {
            const email = emailInput.value.trim();
            const username = signupUsernameInput.value.trim();
            const password = signupPasswordInput.value;
            const passwordConfirm = signupPasswordConfirmInput.value;

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setStatus("Wpisz poprawny adres e-mail w poprzednim kroku.", "error");
                emailInput.focus();
                return;
            }
            if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
                setStatus("Login musi mieć 3–24 znaki: litery bez polskich znaków, cyfry lub podkreślenie.", "error");
                signupUsernameInput.focus();
                return;
            }
            if (password.length < 8) {
                setStatus("Hasło musi mieć co najmniej 8 znaków.", "error");
                signupPasswordInput.focus();
                return;
            }
            if (password !== passwordConfirm) {
                setStatus("Podane hasła nie są identyczne.", "error");
                signupPasswordConfirmInput.focus();
                return;
            }

            setBusy([signupCreateButton, signupCancelButton], true, "TWORZENIE KONTA...");
            const result = await client.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: new URL("./index.html", window.location.href).toString(),
                    data: { username: username }
                }
            });
            setBusy([signupCreateButton, signupCancelButton], false);

            if (result.error) {
                setStatus("Nie udało się założyć konta: " + result.error.message, "error");
                return;
            }

            if (result.data.session && result.data.user) {
                cachedUser = result.data.user;
                window.location.href = "./album.html";
                return;
            }

            signupFields.hidden = true;
            loginFields.hidden = false;
            signupPasswordInput.value = "";
            signupPasswordConfirmInput.value = "";
            setStatus("Konto zostało utworzone. Sprawdź pocztę, potwierdź adres e-mail, a następnie zaloguj się.", "success");
        });

        forgotButton.addEventListener("click", async function () {
            const email = emailInput.value.trim();

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setStatus("Wpisz poprawny adres e-mail, aby odzyskać hasło.", "error");
                emailInput.focus();
                return;
            }

            setBusy([loginButton, signupButton, forgotButton], true, "WYSYŁANIE...");
            const result = await client.auth.resetPasswordForEmail(email, {
                redirectTo: new URL("./index.html", window.location.href).toString()
            });
            setBusy([loginButton, signupButton, forgotButton], false);

            if (result.error) {
                setStatus("Nie udało się wysłać wiadomości: " + result.error.message, "error");
                return;
            }

            setStatus("Jeśli konto istnieje, wysłaliśmy wiadomość z linkiem do zmiany hasła.", "success");
        });

        logoutButton.addEventListener("click", async function () {
            const { error: signOutError } = await client.auth.signOut();

            if (signOutError) {
                setStatus("Nie udało się wylogować: " + signOutError.message, "error");
                return;
            }

            cachedUser = null;
            showLoggedOut();
            setStatus("Wylogowano z konta.", "success");
        });

        if (savePasswordButton) {
            savePasswordButton.addEventListener("click", async function () {
                const newPassword = newPasswordInput.value;

                if (newPassword.length < 8) {
                    setStatus("Nowe hasło musi mieć co najmniej 8 znaków.", "error");
                    return;
                }

                setBusy([savePasswordButton], true, "ZAPISYWANIE...");
                const result = await client.auth.updateUser({ password: newPassword });
                setBusy([savePasswordButton], false);

                if (result.error) {
                    setStatus("Nie udało się zmienić hasła: " + result.error.message, "error");
                    return;
                }

                passwordRecoveryMode = false;
                newPasswordInput.value = "";
                showLoggedIn(result.data.user);
                setStatus("Hasło zostało zmienione. Możesz już korzystać z konta.", "success");
            });
        }

        if (window.location.search.includes("auth=required")) {
            setStatus("Zaloguj się, aby otworzyć swoją kolekcję.", "error");
        }
    }

    async function initializeAlbumAuth() {
        const controls = document.getElementById("album-auth-controls");
        if (!controls) return;

        const user = await requireSession();
        if (!user) return;

        const email = document.getElementById("album-auth-email");
        const logout = document.getElementById("album-logout-button");

        if (email) email.textContent = user.email || "ZALOGOWANO";
        controls.hidden = false;

        if (logout) {
            logout.addEventListener("click", async function () {
                logout.disabled = true;
                const { error } = await client.auth.signOut();

                if (error) {
                    logout.disabled = false;
                    alert("Nie udało się wylogować: " + error.message);
                    return;
                }

                cachedUser = null;
                window.location.replace("./index.html");
            });
        }
    }

    client.auth.onAuthStateChange(function (event, session) {
        cachedUser = session && session.user ? session.user : null;

        if (event === "SIGNED_IN" && session && session.user &&
            document.getElementById("cover-auth-form") && !passwordRecoveryMode) {
            showLoggedIn(session.user);
        }

        if (event === "SIGNED_OUT" && document.getElementById("cover-auth-form")) {
            showLoggedOut();
        }

        if (event === "PASSWORD_RECOVERY") {
            passwordRecoveryMode = true;
            const recovery = document.getElementById("cover-auth-recovery");
            const form = document.getElementById("cover-auth-form");
            if (recovery) recovery.hidden = false;
            if (form) form.hidden = true;
            setStatus("Ustaw nowe hasło do swojego konta.", "success");
        }
    });

    document.addEventListener("DOMContentLoaded", function () {
        initializeIndexAuth();
        initializeAlbumAuth();
    });
})();