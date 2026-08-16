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

    /*
     * Login:
     * #login-message
     *
     * Rejestracja:
     * #register-message
     */

    return (
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
}


function hideMessage() {

    const box = getMessageBox();

    if (!box) return;

    box.hidden = true;

    box.textContent = "";

    box.className = "auth-message";
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


    email = String(email || "").trim();


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
                     * Po kliknięciu CONFIRM w mailu
                     * Supabase wróci tutaj.
                     *
                     * Ponieważ pracujemy teraz lokalnie,
                     * używamy aktualnego adresu strony.
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
         * Supabase zwraca user bez session,
         * kiedy wymagane jest potwierdzenie e-maila.
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
         * jest wyłączone — użytkownik
         * może zostać zalogowany od razu.
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
     * NASZ HTML MA:
     *
     * id="login-button"
     *
     * a nie login-btn.
     */

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


    /*
     * NASZ REGISTER.HTML MA:
     *
     * register-password-confirm
     *
     * a nie:
     *
     * register-password-repeat
     */

    const passwordRepeatInput =
        document.getElementById(
            "register-password-confirm"
        );


    /*
     * NASZ REGISTER.HTML MA:
     *
     * register-button
     */

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
   AUTOMATYCZNA INICJALIZACJA
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        /*
         * Najpierw sprawdzamy, na jakiej
         * stronie jesteśmy.
         */

        const isLoginPage =
            document.getElementById(
                "login-form"
            );


        const isRegisterPage =
            document.getElementById(
                "register-form"
            );


        /*
         * Inicjalizacja formularzy.
         */

        initLoginForm();

        initRegisterForm();


        /*
         * Jeżeli jesteśmy na login.html
         * lub register.html i użytkownik
         * już ma sesję — przenosimy go
         * automatycznie do home.html.
         */

        if (
            isLoginPage ||
            isRegisterPage
        ) {

            await redirectIfLoggedIn();
        }

    }
);
