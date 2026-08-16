/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   auth.js

   AUTORYZACJA UŻYTKOWNIKÓW — SUPABASE

   STRUKTURA:
   index.html    = główny album
   login.html    = logowanie
   register.html = rejestracja

   Jeden plik obsługuje:
   - rejestrację
   - logowanie
   - wylogowanie
   - sprawdzanie użytkownika
   - ochronę index.html
   - przekierowanie zalogowanego użytkownika
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

    /*
     * Twój login.html używa:
     *
     * id="auth-message"
     *
     * Rejestracja może używać:
     *
     * id="register-message"
     */

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

    const box = getMessageBox();


    if (!box) {

        alert(message);

        return;
    }


    box.textContent = message;

    box.className =
        "auth-message " + type;

    box.hidden = false;

    box.style.display = "block";
}


function hideMessage() {

    const box = getMessageBox();


    if (!box) return;


    box.hidden = true;

    box.textContent = "";

    box.className = "auth-message";

    box.style.display = "none";
}


/* =========================================================
   POMOCNICZE — PRZYCISK
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


    email =
        String(email || "").trim();


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

                email: email,

                password: password,

                options: {

                    /*
                     * Po potwierdzeniu adresu
                     * użytkownik wraca do albumu.
                     */

                    emailRedirectTo:
                        window.location.origin +
                        "/index.html"
                }

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
         * Konto utworzone,
         * ale wymagane potwierdzenie e-mail.
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
         * Potwierdzanie e-maila wyłączone.
         * Supabase zalogował użytkownika od razu.
         */

        if (
            data &&
            data.session
        ) {

            window.location.href =
                "index.html";

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


    email =
        String(email || "").trim();


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

                email: email,

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


        if (
            data &&
            data.session
        ) {

            /*
             * GŁÓWNY ALBUM = index.html
             */

            window.location.href =
                "index.html";

            return true;
        }


        showMessage(
            "Nie udało się utworzyć sesji."
        );


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


        return data.user || null;


    } catch (error) {

        console.error(
            "Błąd getCurrentUser:",
            error
        );


        return null;
    }
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
   PRZEKIEROWANIE JEŚLI JUŻ ZALOGOWANY
   ========================================================= */

async function redirectIfLoggedIn() {

    const user =
        await getCurrentUser();


    if (user) {

        window.location.href =
            "index.html";


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


    if (!form) return;


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
             * Jeżeli logowanie się udało,
             * nastąpi przekierowanie.
             *
             * Jeżeli nie — przycisk wraca
             * do normalnego stanu.
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
   OBSŁUGA REGISTER.HTML
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
   BŁĘDY SUPABASE
   ========================================================= */

function getAuthErrorMessage(error) {

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


    /*
     * Pusta ścieżka = również index.html
     */

    if (!path) {

        return "index.html";
    }


    return path;
}


/* =========================================================
   AUTOMATYCZNA INICJALIZACJA
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {


        const currentPage =
            getCurrentPage();


        const isLoginPage =
            currentPage === "login.html";


        const isRegisterPage =
            currentPage === "register.html";


        const isHomePage =
            currentPage === "index.html";


        /* =================================================
           LOGIN / REGISTER
           ================================================= */

        if (
            isLoginPage ||
            isRegisterPage
        ) {

            /*
             * Inicjalizujemy odpowiedni formularz.
             */

            initLoginForm();

            initRegisterForm();


            /*
             * Jeżeli użytkownik już jest zalogowany,
             * nie ma po co pokazywać mu logowania.
             */

            await redirectIfLoggedIn();


            return;
        }


        /* =================================================
           GŁÓWNY ALBUM — INDEX.HTML
           ================================================= */

        if (isHomePage) {

            /*
             * INDEX.HTML jest chroniony.
             *
             * Bez sesji → login.html
             * Z sesją → album działa normalnie.
             */

            const user =
                await requireAuth();


            if (!user) {

                return;
            }


            console.log(
                "Zalogowany użytkownik:",
                user.email
            );


            /*
             * Tutaj NIE przekierowujemy dalej.
             *
             * Album może normalnie uruchomić
             * swój istniejący script.js.
             */

        }

    }
);
