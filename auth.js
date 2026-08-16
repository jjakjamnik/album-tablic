/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   auth.js

   STRUKTURA:

   index.html      = STRONA GŁÓWNA / LANDING
   login.html      = LOGOWANIE
   register.html   = REJESTRACJA
   home.html       = WŁAŚCIWY ALBUM

   SUPABASE AUTH
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
                     * użytkownik wraca do właściwego albumu.
                     */

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
                getAuthErrorMessage(error)
            );


            return false;
        }


        /*
         * Konto utworzone,
         * ale Supabase wymaga potwierdzenia e-mail.
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
         * jest wyłączone, użytkownik
         * zostaje zalogowany od razu.
         */

        if (
            data &&
            data.session
        ) {

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
             * POPRAWNE LOGOWANIE
             * → WŁAŚCIWY ALBUM
             */

            window.location.href =
                "home.html";

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


        /*
         * PO WYLOGOWANIU → LANDING
         */

        window.location.href =
            "index.html";


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
   AKTUALNY UŻYTKOWNIK
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
   OCHRONA HOME.HTML
   ========================================================= */

async function requireAuth() {

    const user =
        await getCurrentUser();


    if (!user) {

        /*
         * Próba wejścia do albumu
         * bez zalogowania.
         */

        window.location.href =
            "login.html";


        return null;
    }


    return user;
}


/* =========================================================
   PRZEKIEROWANIE Z LOGIN / REGISTER
   ========================================================= */

async function redirectIfLoggedIn() {

    const user =
        await getCurrentUser();


    if (user) {

        /*
         * Użytkownik jest już zalogowany.
         * Nie pokazujemy mu ponownie
         * formularza logowania/rejestracji.
         */

        window.location.href =
            "home.html";


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


            const success =
                await loginUser(
                    email,
                    password
                );


            /*
             * Przy błędzie przywracamy przycisk.
             *
             * Przy sukcesie nastąpi
             * przekierowanie do home.html.
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


            const success =
                await registerUser(
                    email,
                    password
                );


            /*
             * Jeżeli wystąpił błąd,
             * przywracamy przycisk.
             */

            if (!success) {

                setLoading(
                    button,
                    false,
                    "UTWÓRZ KONTO"
                );

            } else {

                /*
                 * Jeśli wymagane jest potwierdzenie
                 * e-mail, pozostajemy na register.html.
                 */

                setTimeout(
                    function() {

                        setLoading(
                            button,
                            false,
                            "UTWÓRZ KONTO"
                        );

                    },
                    300
                );

            }

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
            currentPage === "home.html";


        const isLandingPage =
            currentPage === "index.html";


        /* =================================================
           INDEX.HTML — LANDING
           ================================================= */

        if (isLandingPage) {

            /*
             * Landing jest publiczny.
             *
             * Nie sprawdzamy tutaj sesji.
             * Nie przekierowujemy automatycznie.
             */

            return;
        }


        /* =================================================
           LOGIN / REGISTER
           ================================================= */

        if (
            isLoginPage ||
            isRegisterPage
        ) {

            initLoginForm();

            initRegisterForm();


            /*
             * Jeżeli użytkownik jest już zalogowany,
             * → home.html
             */

            await redirectIfLoggedIn();


            return;
        }


        /* =================================================
           HOME.HTML — WŁAŚCIWY ALBUM
           ================================================= */

        if (isHomePage) {

            /*
             * HOME jest chronione.
             *
             * Brak sesji:
             * → login.html
             *
             * Jest sesja:
             * → album działa.
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


            return;
        }

    }
);
