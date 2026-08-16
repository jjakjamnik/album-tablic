/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   auth.js

   AUTORYZACJA UŻYTKOWNIKÓW — SUPABASE

   OBSŁUGUJE:
   - LOGOWANIE
   - REJESTRACJĘ
   - WYLOGOWANIE
   - POBIERANIE AKTUALNEGO UŻYTKOWNIKA
   - OCHRONĘ HOME.HTML
   - AUTOMATYCZNE PRZEKIEROWANIA
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
   KOMUNIKATY
   ========================================================= */

function getMessageBox() {

    return (
        document.getElementById("auth-message") ||
        document.getElementById("login-message") ||
        document.getElementById("register-message")
    );

}


function showMessage(
    message,
    type = "error"
) {

    const box =
        getMessageBox();


    if (!box) {

        alert(message);

        return;

    }


    box.textContent =
        message;


    box.className =
        "auth-message " +
        type;


    box.hidden =
        false;

}


function hideMessage() {

    const box =
        getMessageBox();


    if (!box) {
        return;
    }


    box.hidden =
        true;


    box.textContent =
        "";


    box.className =
        "auth-message";

}


/* =========================================================
   PRZYCISK — LOADING
   ========================================================= */

function setLoading(
    button,
    loading,
    normalText
) {

    if (!button) {
        return;
    }


    button.disabled =
        loading;


    if (loading) {

        button.dataset.originalText =
            button.textContent;


        button.textContent =
            "PROSZĘ CZEKAĆ...";

    }

    else {

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


    email =
        String(
            email || ""
        ).trim();


    if (
        !email ||
        !password
    ) {

        showMessage(
            "Podaj adres e-mail i hasło."
        );

        return false;

    }


    if (
        password.length < 6
    ) {

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

                email:
                    email,

                password:
                    password,

                options: {

                    emailRedirectTo:
                        window.location.origin +
                        "/home.html"

                }

            });


        if (error) {

            console.error(
                "Błąd rejestracji:",
                error
            );


            showMessage(
                getAuthErrorMessage(
                    error
                )
            );


            return false;

        }


        /* -----------------------------------------
           POTWIERDZENIE E-MAILA WYMAGANE
           ----------------------------------------- */

        if (
            data &&
            data.user &&
            !data.session
        ) {

            showMessage(
                "Konto zostało utworzone. " +
                "Sprawdź swoją skrzynkę e-mail " +
                "i potwierdź adres.",
                "success"
            );


            return true;

        }


        /* -----------------------------------------
           SESJA UTWORZONA OD RAZU
           ----------------------------------------- */

        if (
            data &&
            data.session
        ) {

            window.location.href =
                "home.html";


            return true;

        }


        return true;

    }

    catch (error) {

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


    email =
        String(
            email || ""
        ).trim();


    if (
        !email ||
        !password
    ) {

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

                email:
                    email,

                password:
                    password

            });


        /* -----------------------------------------
           BŁĄD LOGOWANIA
           ----------------------------------------- */

        if (error) {

            console.error(
                "Błąd logowania:",
                error
            );


            showMessage(
                getAuthErrorMessage(
                    error
                )
            );


            return false;

        }


        /* -----------------------------------------
           SESJA
           ----------------------------------------- */

        if (
            data &&
            data.session
        ) {

            console.log(
                "Logowanie zakończone sukcesem.",
                data.user
            );


            window.location.href =
                "home.html";


            return true;

        }


        showMessage(
            "Nie udało się utworzyć sesji."
        );


        return false;

    }

    catch (error) {

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

    }

    catch (error) {

        console.error(
            "Nieoczekiwany błąd wylogowania:",
            error
        );


        return false;

    }

}


/* =========================================================
   POBRANIE AKTUALNEGO UŻYTKOWNIKA
   ========================================================= */

async function getCurrentUser() {

    try {

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


        return (
            data &&
            data.user
                ? data.user
                : null
        );

    }

    catch (error) {

        console.error(
            "Błąd getCurrentUser:",
            error
        );


        return null;

    }

}


/* =========================================================
   POBRANIE SESJI
   ========================================================= */

async function getCurrentSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Błąd pobierania sesji:",
                error
            );


            return null;

        }


        return (
            data &&
            data.session
                ? data.session
                : null
        );

    }

    catch (error) {

        console.error(
            "Błąd getCurrentSession:",
            error
        );


        return null;

    }

}


/* =========================================================
   OCHRONA STRONY
   ========================================================= */

async function requireAuth() {

    const session =
        await getCurrentSession();


    if (!session) {

        window.location.replace(
            "login.html"
        );


        return null;

    }


    const user =
        await getCurrentUser();


    if (!user) {

        window.location.replace(
            "login.html"
        );


        return null;

    }


    return user;

}


/* =========================================================
   PRZEKIEROWANIE JEŻELI JUŻ ZALOGOWANY
   ========================================================= */

async function redirectIfLoggedIn() {

    const session =
        await getCurrentSession();


    if (
        session
    ) {

        window.location.replace(
            "home.html"
        );


        return true;

    }


    return false;

}


/* =========================================================
   OBSŁUGA LOGIN.HTML
   ========================================================= */

function initLoginForm() {

    const form =
        document.getElementById(
            "login-form"
        );


    if (!form) {
        return;
    }


    const emailInput =
        document.getElementById(
            "login-email"
        );


    const passwordInput =
        document.getElementById(
            "login-password"
        );


    /*
     * TWÓJ LOGIN.HTML:
     *
     * id="login-btn"
     */

    const button =
        document.getElementById(
            "login-btn"
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


            setLoading(
                button,
                true,
                "ZALOGUJ SIĘ"
            );


            const success =
                await loginUser(
                    email,
                    password
                );


            /*
             * Jeżeli logowanie się udało,
             * nastąpiło już przekierowanie.
             */

            if (!success) {

                setLoading(
                    button,
                    false,
                    "ZALOGUJ SIĘ"
                );

            }

        }
    );

}


/* =========================================================
   OBSŁUGA REGISTER.HTML
   ========================================================= */

function initRegisterForm() {

    const form =
        document.getElementById(
            "register-form"
        );


    if (!form) {
        return;
    }


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


            /* -----------------------------------------
               SPRAWDZENIE HASEŁ
               ----------------------------------------- */

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


            const success =
                await registerUser(
                    email,
                    password
                );


            if (!success) {

                setLoading(
                    button,
                    false,
                    "UTWÓRZ KONTO"
                );

            }

        }
    );

}


/* =========================================================
   TŁUMACZENIE BŁĘDÓW SUPABASE
   ========================================================= */

function getAuthErrorMessage(
    error
) {

    if (!error) {

        return (
            "Wystąpił nieznany błąd."
        );

    }


    const message =
        String(
            error.message || ""
        ).toLowerCase();


    /* -----------------------------------------
       NIEPRAWIDŁOWE DANE LOGOWANIA
       ----------------------------------------- */

    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return (
            "Nieprawidłowy e-mail lub hasło."
        );

    }


    /* -----------------------------------------
       E-MAIL NIEPOTWIERDZONY
       ----------------------------------------- */

    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return (
            "Najpierw potwierdź swój adres e-mail."
        );

    }


    /* -----------------------------------------
       UŻYTKOWNIK JUŻ ISTNIEJE
       ----------------------------------------- */

    if (
        message.includes(
            "user already registered"
        )
    ) {

        return (
            "Konto z tym adresem e-mail już istnieje."
        );

    }


    /* -----------------------------------------
       ZA KRÓTKIE HASŁO
       ----------------------------------------- */

    if (
        message.includes(
            "password should be at least"
        )
    ) {

        return (
            "Hasło jest za krótkie."
        );

    }


    /* -----------------------------------------
       NIEPRAWIDŁOWY E-MAIL
       ----------------------------------------- */

    if (
        message.includes(
            "invalid email"
        )
    ) {

        return (
            "Podany adres e-mail jest nieprawidłowy."
        );

    }


    /* -----------------------------------------
       LIMIT PRÓB
       ----------------------------------------- */

    if (
        message.includes(
            "rate limit"
        )
    ) {

        return (
            "Zbyt wiele prób. Spróbuj ponownie za chwilę."
        );

    }


    if (
        message.includes(
            "email rate limit exceeded"
        )
    ) {

        return (
            "Limit wysyłania wiadomości e-mail został przekroczony. Spróbuj ponownie później."
        );

    }


    /* -----------------------------------------
       DOMYŚLNY KOMUNIKAT
       ----------------------------------------- */

    return (
        error.message ||
        "Wystąpił błąd autoryzacji."
    );

}


/* =========================================================
   AUTOMATYCZNA INICJALIZACJA
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        /* -----------------------------------------
           SPRAWDZAMY STRONĘ
           ----------------------------------------- */

        const loginForm =
            document.getElementById(
                "login-form"
            );


        const registerForm =
            document.getElementById(
                "register-form"
            );


        const isHomePage =
            window.location.pathname
                .toLowerCase()
                .endsWith(
                    "/home.html"
                ) ||
            window.location.pathname
                .toLowerCase()
                .endsWith(
                    "home.html"
                );


        /* -----------------------------------------
           LOGIN
           ----------------------------------------- */

        initLoginForm();


        /* -----------------------------------------
           REGISTER
           ----------------------------------------- */

        initRegisterForm();


        /* -----------------------------------------
           LOGIN / REGISTER
           ----------------------------------------- */

        if (
            loginForm ||
            registerForm
        ) {

            await redirectIfLoggedIn();

            return;

        }


        /* -----------------------------------------
           HOME
           ----------------------------------------- */

        if (
            isHomePage
        ) {

            await requireAuth();

            return;

        }

    }
);


/* =========================================================
   NASŁUCHIWANIE ZMIAN SESJI
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
    function(event, session) {

        console.log(
            "Supabase Auth:",
            event,
            session
                ? "SESJA AKTYWNA"
                : "BRAK SESJI"
        );

    }
);


/* =========================================================
   GOTOWE
   ========================================================= */
