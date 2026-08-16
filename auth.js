/* =========================================================
   ALBUM TABLIC
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
   INICJALIZACJA
   ========================================================= */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* =========================================================
   POMOCNICZE
   ========================================================= */

function getCurrentPage() {

    return window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

}


function goTo(page) {

    window.location.href = page;

}


/* =========================================================
   SPRAWDZENIE SESJI
   ========================================================= */

async function getCurrentUser() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();

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
   REJESTRACJA
   ========================================================= */

async function registerUser(email, password) {

    email = email.trim();

    if (!email || !password) {

        return {
            success: false,
            message: "Podaj e-mail i hasło."
        };

    }


    if (password.length < 6) {

        return {
            success: false,
            message: "Hasło musi mieć minimum 6 znaków."
        };

    }


    const {
        data,
        error
    } = await supabaseClient.auth.signUp({

        email: email,

        password: password

    });


    if (error) {

        console.error(
            "Błąd rejestracji:",
            error
        );

        return {
            success: false,
            message: error.message
        };

    }


    return {
        success: true,
        data: data
    };

}


/* =========================================================
   LOGOWANIE
   ========================================================= */

async function loginUser(email, password) {

    email = email.trim();


    if (!email || !password) {

        return {
            success: false,
            message: "Podaj e-mail i hasło."
        };

    }


    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

    });


    if (error) {

        console.error(
            "Błąd logowania:",
            error
        );

        return {
            success: false,
            message: "Nieprawidłowy e-mail lub hasło."
        };

    }


    return {
        success: true,
        data: data
    };

}


/* =========================================================
   WYLOGOWANIE
   ========================================================= */

async function logoutUser() {

    const {
        error
    } = await supabaseClient.auth.signOut();


    if (error) {

        console.error(
            "Błąd wylogowania:",
            error
        );

        return false;

    }


    return true;

}


/* =========================================================
   OCHRONA HOME
   Jeżeli użytkownik nie jest zalogowany,
   wracamy do login.html
   ========================================================= */

async function requireLogin() {

    const user = await getCurrentUser();


    if (!user) {

        goTo("login.html");

        return null;

    }


    return user;

}


/* =========================================================
   JEŻELI UŻYTKOWNIK JEST JUŻ ZALOGOWANY,
   NIE MA SENSU POKAZYWAĆ LOGIN / REGISTER
   ========================================================= */

async function redirectIfLoggedIn() {

    const user = await getCurrentUser();


    if (!user) {

        return null;

    }


    const page = getCurrentPage();


    if (
        page === "login.html" ||
        page === "register.html"
    ) {

        goTo("home.html");

    }


    return user;

}


/* =========================================================
   OBSŁUGA ZMIAN SESJI
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "Zmiana sesji:",
            event
        );

    }
);


/* =========================================================
   AUTOMATYCZNE SPRAWDZENIE STRONY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const page = getCurrentPage();


        /*
         * LOGIN / REGISTER
         */

        if (
            page === "login.html" ||
            page === "register.html"
        ) {

            await redirectIfLoggedIn();

            return;

        }


        /*
         * HOME
         */

        if (page === "home.html") {

            const user = await requireLogin();


            if (!user) {

                return;

            }


            console.log(
                "Zalogowany użytkownik:",
                user.email
            );

        }

    }
);
