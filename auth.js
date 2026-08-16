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

    return (
        document.getElementById("auth-message") ||
        document.getElementById("login-message") ||
        document.getElementById("register-message")
    );
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
         * Jeżeli potwierdzanie e-maila
         * jest wyłączone.
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
   PRZEKIEROWANIE Z LOGIN / REGISTER
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
   OBSŁUGA LOGIN
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
     * LOGIN.HTML:
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


            try {

                await loginUser(
                    email,
                    password
                );

            } finally {

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
   OBSŁUGA REJESTRACJI
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


    /*
     * Dla bezpieczeństwa obsługujemy
     * również alternatywną nazwę.
     */

    const passwordRepeat =
        passwordRepeatInput ||
        document.getElementById(
            "register-password-repeat"
        );


    const button =
        document.getElementById(
            "register-button"
        ) ||
        document.getElementById(
            "register-btn"
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


            const passwordConfirmation =
                passwordRepeat
                    ? passwordRepeat.value
                    : "";


            if (
                password !==
                passwordConfirmation
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


            try {

                await registerUser(
                    email,
                    password
                );

            } finally {

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
   OBSŁUGA LOGOUT
   ========================================================= */

function initLogoutButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-logout]"
        );


    buttons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                async function(event) {

                    event.preventDefault();

                    await logoutUser();

                }
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


    if (
        message.includes(
            "too many requests"
        )
    ) {

        return (
            "Zbyt wiele prób. Spróbuj ponownie później."
        );
    }


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

        /*
         * Sprawdzamy stronę.
         */

        const isLoginPage =
            !!document.getElementById(
                "login-form"
            );


        const isRegisterPage =
            !!document.getElementById(
                "register-form"
            );


        const isHomePage =
            document.body.dataset.page === "home" ||
            window.location.pathname
                .toLowerCase()
                .endsWith("/home.html");


        /*
         * Formularze.
         */

        initLoginForm();

        initRegisterForm();

        initLogoutButtons();


        /*
         * LOGIN / REGISTER
         *
         * Jeżeli użytkownik już jest
         * zalogowany — nie ma sensu
         * pokazywać formularza.
         */

        if (
            isLoginPage ||
            isRegisterPage
        ) {

            await redirectIfLoggedIn();

            return;
        }


        /*
         * HOME
         *
         * Jeżeli home.html korzysta
         * z auth.js, zabezpieczamy stronę.
         */

        if (isHomePage) {

            await requireAuth();
        }

    }
);
