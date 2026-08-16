/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   auth.js

   AUTORYZACJA — SUPABASE

   STRUKTURA:
   home.html     = główny album
   login.html    = logowanie
   register.html = rejestracja

   WERSJA TESTOWA — STABILNY PRZEPŁYW SESJI

   - logowanie
   - rejestracja
   - wylogowanie
   - sprawdzanie sesji
   - ochrona home.html
   - przekierowanie zalogowanego z login/register
   - HOME = home.html
   - brak getUser() przy ochronie strony
   ========================================================= */


/* =========================================================
   KONFIGURACJA SUPABASE
   ========================================================= */

const AUTH_SUPABASE_URL =
    "https://ddlwmtbtsaikbkorkwaa.supabase.co";

const AUTH_SUPABASE_ANON_KEY =
    "sb_publishable_i9lPlpSiRH5wLzI8QJ_gcA_-n0IZNL2";


/* =========================================================
   INICJALIZACJA SUPABASE
   ========================================================= */

const supabaseClient =
    window.supabase.createClient(
        AUTH_SUPABASE_URL,
        AUTH_SUPABASE_ANON_KEY
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


    box.style.display =
        "block";

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


    box.style.display =
        "none";

}


/* =========================================================
   PRZYCISK — ŁADOWANIE
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
   SESJA
   ========================================================= */

/*
 * Najważniejsza funkcja całego pliku.
 *
 * NIE używamy tutaj getUser().
 *
 * Sprawdzamy sesję zapisaną przez Supabase
 * w przeglądarce.
 */

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
            "Nieoczekiwany błąd sesji:",
            error
        );


        return null;

    }

}


/* =========================================================
   AKTUALNY UŻYTKOWNIK
   ========================================================= */

async function getCurrentUser() {

    const session =
        await getCurrentSession();


    if (!session) {

        return null;

    }


    return (
        session.user ||
        null
    );

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


        /*
         * Supabase wymaga potwierdzenia e-maila.
         */

        if (
            data &&
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
         * jest wyłączone — mamy sesję.
         */

        if (
            data &&
            data.session
        ) {

            window.location.replace(
                "home.html"
            );


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


        if (
            !data ||
            !data.session
        ) {

            showMessage(
                "Logowanie nie utworzyło sesji."
            );


            return false;

        }


        console.log(
            "LOGOWANIE OK:",
            data.user
                ? data.user.email
                : "brak"
        );


        /*
         * replace zamiast href.
         *
         * Nie zostawiamy login.html
         * w historii przeglądarki.
         */

        window.location.replace(
            "home.html"
        );


        return true;

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


        window.location.replace(
            "login.html"
        );


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
   OCHRONA HOME
   ========================================================= */

async function requireAuth() {

    const session =
        await getCurrentSession();


    /*
     * SESJA ISTNIEJE
     * → użytkownik może zostać na home.
     */

    if (session) {

        return (
            session.user ||
            null
        );

    }


    /*
     * BRAK SESJI
     * → login.
     */

    console.log(
        "HOME: brak aktywnej sesji."
    );


    window.location.replace(
        "login.html"
    );


    return null;

}


/* =========================================================
   PRZEKIEROWANIE Z LOGIN / REGISTER
   ========================================================= */

async function redirectIfLoggedIn() {

    const session =
        await getCurrentSession();


    if (session) {

        console.log(
            "Użytkownik jest już zalogowany."
        );


        window.location.replace(
            "home.html"
        );


        return true;

    }


    return false;

}


/* =========================================================
   LOGIN FORM
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


    const button =
        document.getElementById(
            "login-btn"
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


            /*
             * Jeżeli nastąpiło przekierowanie,
             * przeglądarka opuści tę stronę.
             */

            setLoading(
                button,
                false,
                "ZALOGUJ SIĘ"
            );

        }
    );

}


/* =========================================================
   REGISTER FORM
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
   BŁĘDY SUPABASE
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


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return (
            "Nieprawidłowy e-mail lub hasło."
        );

    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return (
            "Najpierw potwierdź swój adres e-mail."
        );

    }


    if (
        message.includes(
            "user already registered"
        )
    ) {

        return (
            "Konto z tym adresem e-mail już istnieje."
        );

    }


    if (
        message.includes(
            "password should be at least"
        )
    ) {

        return (
            "Hasło jest za krótkie."
        );

    }


    if (
        message.includes(
            "invalid email"
        )
    ) {

        return (
            "Podany adres e-mail jest nieprawidłowy."
        );

    }


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


    return (
        error.message ||
        "Wystąpił błąd autoryzacji."
    );

}


/* =========================================================
   ROZPOZNANIE STRONY
   ========================================================= */

function getCurrentPage() {

    const path =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (!path) {

        return "home.html";

    }


    return path;

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        const currentPage =
            getCurrentPage();


        const isLoginPage =
            currentPage ===
            "login.html";


        const isRegisterPage =
            currentPage ===
            "register.html";


        const isHomePage =
            currentPage ===
            "home.html";


        /* =================================================
           LOGIN / REGISTER
           ================================================= */

        if (
            isLoginPage ||
            isRegisterPage
        ) {

            /*
             * Najpierw uruchamiamy formularz.
             */

            if (isLoginPage) {

                initLoginForm();

            }


            if (isRegisterPage) {

                initRegisterForm();

            }


            /*
             * Jeżeli jest aktywna sesja,
             * użytkownik nie potrzebuje loginu.
             */

            await redirectIfLoggedIn();


            return;

        }


        /* =================================================
           HOME
           ================================================= */

        if (isHomePage) {

            const user =
                await requireAuth();


            if (!user) {

                return;

            }


            console.log(
                "HOME — ZALOGOWANY:",
                user.email
            );


            /*
             * KONIEC.
             *
             * Nie ma tutaj żadnego:
             *
             * getUser()
             * login.html
             * home.html
             *
             * ani dodatkowego przekierowania.
             *
             * HOME zostaje HOME.
             */

            return;

        }

    }
);
