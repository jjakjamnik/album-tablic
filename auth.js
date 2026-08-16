/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   auth.js

   AUTORYZACJA UŻYTKOWNIKÓW — SUPABASE
   ========================================================= */


/* =========================================================
   KONFIGURACJA SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://ddlwmtbtsaikbkorkwaa.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_i9lPlpSiRH5wLzI8QJ_gcA_-n0IZNL2";


/* =========================================================
   INICJALIZACJA SUPABASE
   ========================================================= */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


/* =========================================================
   POMOCNICZE — KOMUNIKATY
   ========================================================= */

function getMessageBox() {

    const loginMessage =
        document.getElementById("login-message");

    if (loginMessage) {
        return loginMessage;
    }


    const registerMessage =
        document.getElementById("register-message");

    if (registerMessage) {
        return registerMessage;
    }


    return null;
}


function showMessage(message, type = "error") {

    const box = getMessageBox();

    if (!box) {

        alert(message);

        return;
    }


    box.textContent = message;

    box.className =
        "auth-message " + type;

    box.hidden = false;
}


function hideMessage() {

    const box = getMessageBox();

    if (!box) return;


    box.hidden = true;

    box.textContent = "";

    box.className = "auth-message";
}


/* =========================================================
   PRZYCISK — LOADING
   ========================================================= */

function setLoading(
    button,
    loading,
    normalText
) {

    if (!button) return;


    button.disabled = loading;


    if (loading) {

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "PROSZĘ CZEKAĆ...";

    } else {

        button.textContent =
            button.dataset.originalText ||
            normalText;
    }
}


/* =========================================================
   REJESTRACJA
   ========================================================= */

async function registerUser(
    email,
    password
) {

    hideMessage();


    if (!email || !password) {

        showMessage(
            "Podaj adres e-mail i hasło."
        );

        return false;
    }


    if (password.length < 6) {

        showMessage(
            "Hasło musi mieć co najmniej 6 znaków."
        );

        return false;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({

                email: email.trim(),

                password: password

            });


        if (error) {

            console.error(
                "Błąd rejestracji:",
                error
            );

            showMessage(
                getAuthErrorMessage(error)
            );

            return false;
        }


        /*
         * Supabase może wymagać
         * potwierdzenia adresu e-mail.
         */

        if (
            data.user &&
            !data.session
        ) {

            showMessage(
                "Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail i potwierdź adres.",
                "success"
            );

            return true;
        }


        /*
         * Jeżeli potwierdzanie e-maila
         * jest wyłączone — logujemy od razu.
         */

        if (data.session) {

            window.location.href =
                "home.html";

            return true;
        }


        return true;

    } catch (error) {

        console.error(
            "Nieoczekiwany błąd rejestracji:",
            error
        );

        showMessage(
            "Wystąpił nieoczekiwany błąd."
        );

        return false;
    }
}


/* =========================================================
   LOGOWANIE
   ========================================================= */

async function loginUser(
    email,
    password
) {

    hideMessage();


    if (!email || !password) {

        showMessage(
            "Podaj adres e-mail i hasło."
        );

        return false;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({

                email: email.trim(),

                password: password

            });


        if (error) {

            console.error(
                "Błąd logowania:",
                error
            );

            showMessage(
                getAuthErrorMessage(error)
            );

            return false;
        }


        if (data.session) {

            window.location.href =
                "home.html";

            return true;
        }


        return false;

    } catch (error) {

        console.error(
            "Nieoczekiwany błąd logowania:",
            error
        );

        showMessage(
            "Wystąpił nieoczekiwany błąd."
        );

        return false;
    }
}


/* =========================================================
   WYLOGOWANIE
   ========================================================= */

async function logoutUser() {

    try {

        const {
            error
        } =
            await supabaseClient.auth.signOut();


        if (error) {

            console.error(
                "Błąd wylogowania:",
                error
            );

            return false;
        }


        window.location.href =
            "login.html";

        return true;

    } catch (error) {

        console.error(
            "Nieoczekiwany błąd wylogowania:",
            error
        );

        return false;
    }
}


/* =========================================================
   POBIERANIE AKTUALNEGO UŻYTKOWNIKA
   ========================================================= */

async function getCurrentUser() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (error) {

        console.error(
            "Błąd pobierania użytkownika:",
            error
        );

        return null;
    }


    return data.user || null;
}


/* =========================================================
   OCHRONA STRONY
   ========================================================= */

async function requireAuth() {

    const user =
        await getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html";

        return null;
    }


    return user;
}


/* =========================================================
   JEŻELI JUŻ ZALOGOWANY
   ========================================================= */

async function redirectIfLoggedIn() {

    const user =
        await getCurrentUser();


    if (user) {

        window.location.href =
            "home.html";

        return true;
    }


    return false;
}


/* =========================================================
   FORMULARZ LOGOWANIA
   ========================================================= */

function initLoginForm() {

    const form =
        document.getElementById(
            "login-form"
        );


    if (!form) return;


    const emailInput =
        document.getElementById(
            "login-email"
        );


    const passwordInput =
        document.getElementById(
            "login-password"
        );


    const button =
        document.getElementById(
            "login-button"
        );


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const email =
                emailInput
                    ? emailInput.value
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            setLoading(
                button,
                true,
                "ZALOGUJ SIĘ"
            );


            await loginUser(
                email,
                password
            );


            setLoading(
                button,
                false,
                "ZALOGUJ SIĘ"
            );

        }
    );
}


/* =========================================================
   FORMULARZ REJESTRACJI
   ========================================================= */

function initRegisterForm() {

    const form =
        document.getElementById(
            "register-form"
        );


    if (!form) return;


    const emailInput =
        document.getElementById(
            "register-email"
        );


    const passwordInput =
        document.getElementById(
            "register-password"
        );


    const passwordRepeatInput =
        document.getElementById(
            "register-password-confirm"
        );


    const button =
        document.getElementById(
            "register-button"
        );


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            hideMessage();


            const email =
                emailInput
                    ? emailInput.value
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            const passwordRepeat =
                passwordRepeatInput
                    ? passwordRepeatInput.value
                    : "";


            if (
                password !==
                passwordRepeat
            ) {

                showMessage(
                    "Hasła nie są takie same."
                );

                return;
            }


            setLoading(
                button,
                true,
                "UTWÓRZ KONTO"
            );


            await registerUser(
                email,
                password
            );


            setLoading(
                button,
                false,
                "UTWÓRZ KONTO"
            );

        }
    );
}


/* =========================================================
   KOMUNIKATY BŁĘDÓW SUPABASE
   ========================================================= */

function getAuthErrorMessage(error) {

    if (!error) {

        return "Wystąpił nieznany błąd.";
    }


    const message =
        String(
            error.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "Nieprawidłowy e-mail lub hasło.";
    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "Najpierw potwierdź swój adres e-mail.";
    }


    if (
        message.includes(
            "user already registered"
        )
    ) {

        return "Konto z tym adresem e-mail już istnieje.";
    }


    if (
        message.includes(
            "password should be at least"
        )
    ) {

        return "Hasło jest za krótkie.";
    }


    if (
        message.includes(
            "invalid email"
        )
    ) {

        return "Podany adres e-mail jest nieprawidłowy.";
    }


    if (
        message.includes(
            "rate limit"
        )
    ) {

        return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
    }


    return (
        error.message ||
        "Wystąpił błąd autoryzacji."
    );
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initLoginForm();

        initRegisterForm();

    }
);
