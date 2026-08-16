/* =========================================================
   ALBUM TABLIC
   auth.js

   WERSJA 9.0

   - SUPABASE AUTH
   - LOGOWANIE E-MAIL + HASŁO
   - SESJA ZAPISYWANA W PRZEGLĄDARCE
   - AUTOMATYCZNE ODNAWIANIE SESJI
   - getCurrentUser() DOSTĘPNE DLA script.js
   - OCHRONA STRON ALBUMU
   - BRAK login.js
   ========================================================= */


/* =========================================================
   SUPABASE — KONFIGURACJA
   ========================================================= */

const AUTH_SUPABASE_URL =
    "https://ddlwmtbtsaikbkorkwaa.supabase.co";

const AUTH_SUPABASE_KEY =
    "sb_publishable_i9lPlpSiRH5wLzI8QJ_gcA_-n0IZNL2";


/* =========================================================
   SUPABASE CLIENT
   ========================================================= */

if (
    typeof window.supabase === "undefined"
) {

    console.error(
        "Supabase JS nie został załadowany."
    );

}


/*
 * Tworzymy JEDEN klient Supabase.
 *
 * Najważniejsze:
 *
 * persistSession: true
 * → sesja zostaje w przeglądarce
 *
 * autoRefreshToken: true
 * → token jest automatycznie odnawiany
 *
 * detectSessionInUrl: true
 * → Supabase może obsłużyć sesję przekazaną
 *   przez URL
 */

const albumSupabase =
    window.supabase.createClient(
        AUTH_SUPABASE_URL,
        AUTH_SUPABASE_KEY,
        {

            auth: {

                persistSession:
                    true,

                autoRefreshToken:
                    true,

                detectSessionInUrl:
                    true

            }

        }
    );


/*
 * Udostępniamy klienta globalnie.
 *
 * Dzięki temu inne pliki mogą korzystać
 * z tego samego klienta, jeżeli będzie potrzeba.
 */

window.albumSupabase =
    albumSupabase;


/* =========================================================
   AKTUALNY UŻYTKOWNIK
   ========================================================= */

let albumCurrentUser =
    null;


/* =========================================================
   INICJALIZACJA AUTORYZACJI
   ========================================================= */

let authReadyPromise =
    null;


/*
 * Supabase potrzebuje chwili na odczytanie
 * zapisanej sesji z localStorage.
 *
 * Dlatego nie robimy zwykłego:
 *
 * getSession() → od razu redirect
 *
 * tylko czekamy na zakończenie inicjalizacji.
 */

function initializeAuth() {

    if (authReadyPromise) {

        return authReadyPromise;

    }


    authReadyPromise =
        new Promise(
            async function (resolve) {

                try {

                    const result =
                        await albumSupabase.auth.getSession();


                    if (
                        result.error
                    ) {

                        console.error(
                            "Supabase getSession:",
                            result.error
                        );

                        albumCurrentUser =
                            null;

                    }

                    else if (
                        result.data &&
                        result.data.session &&
                        result.data.session.user
                    ) {

                        albumCurrentUser =
                            result.data.session.user;


                        console.log(
                            "AUTH 9.0 — znaleziono aktywną sesję:",
                            albumCurrentUser.id
                        );

                    }

                    else {

                        albumCurrentUser =
                            null;


                        console.log(
                            "AUTH 9.0 — brak aktywnej sesji."
                        );

                    }

                }

                catch (error) {

                    console.error(
                        "AUTH 9.0 — błąd inicjalizacji:",
                        error
                    );

                    albumCurrentUser =
                        null;

                }


                /*
                 * Nasłuchujemy zmian sesji.
                 */

                albumSupabase.auth.onAuthStateChange(
                    function (
                        event,
                        session
                    ) {

                        if (
                            session &&
                            session.user
                        ) {

                            albumCurrentUser =
                                session.user;


                            console.log(
                                "AUTH 9.0 — zmiana sesji:",
                                event,
                                albumCurrentUser.id
                            );

                        }

                        else {

                            albumCurrentUser =
                                null;


                            console.log(
                                "AUTH 9.0 — użytkownik wylogowany."
                            );

                        }

                    }
                );


                resolve(
                    albumCurrentUser
                );

            }
        );


    return authReadyPromise;

}


/* =========================================================
   GET CURRENT USER
   ========================================================= */

/*
 * TA FUNKCJA JEST UŻYWANA PRZEZ script.js
 *
 * script.js robi:
 *
 * currentUser = await getCurrentUser();
 *
 * więc musi ona istnieć globalnie.
 */

async function getCurrentUser() {

    /*
     * Najpierw czekamy aż Supabase skończy
     * odtwarzać sesję.
     */

    await initializeAuth();


    /*
     * Jeżeli mamy użytkownika w pamięci,
     * możemy go zwrócić.
     */

    if (
        albumCurrentUser
    ) {

        return albumCurrentUser;

    }


    /*
     * Dodatkowa próba pobrania aktualnego
     * użytkownika bezpośrednio z Supabase.
     *
     * To jest celowo getUser(), a nie samo
     * localStorage.
     */

    try {

        const result =
            await albumSupabase.auth.getUser();


        if (
            result.error
        ) {

            console.warn(
                "AUTH 9.0 — getUser:",
                result.error.message
            );


            albumCurrentUser =
                null;


            return null;

        }


        if (
            result.data &&
            result.data.user
        ) {

            albumCurrentUser =
                result.data.user;


            return albumCurrentUser;

        }

    }

    catch (error) {

        console.error(
            "AUTH 9.0 — getUser exception:",
            error
        );

    }


    albumCurrentUser =
        null;


    return null;

}


/*
 * Ważne:
 *
 * funkcja musi być dostępna dla script.js.
 */

window.getCurrentUser =
    getCurrentUser;


/* =========================================================
   GET SESSION
   ========================================================= */

async function getCurrentSession() {

    await initializeAuth();


    try {

        const result =
            await albumSupabase.auth.getSession();


        if (
            result.error
        ) {

            console.error(
                "AUTH 9.0 — getSession:",
                result.error
            );


            return null;

        }


        return (
            result.data &&
            result.data.session
                ? result.data.session
                : null
        );

    }

    catch (error) {

        console.error(
            "AUTH 9.0 — getSession exception:",
            error
        );


        return null;

    }

}


window.getCurrentSession =
    getCurrentSession;


/* =========================================================
   LOGOWANIE
   ========================================================= */

async function loginUser(
    email,
    password
) {

    const cleanEmail =
        String(
            email ||
            ""
        )
            .trim()
            .toLowerCase();


    if (!cleanEmail) {

        throw new Error(
            "Podaj adres e-mail."
        );

    }


    if (!password) {

        throw new Error(
            "Podaj hasło."
        );

    }


    console.log(
        "AUTH 9.0 — próba logowania:",
        cleanEmail
    );


    const result =
        await albumSupabase.auth.signInWithPassword(
            {
                email:
                    cleanEmail,

                password:
                    password
            }
        );


    if (
        result.error
    ) {

        console.error(
            "AUTH 9.0 — błąd logowania:",
            result.error
        );


        throw result.error;

    }


    if (
        !result.data ||
        !result.data.user
    ) {

        throw new Error(
            "Supabase zalogował użytkownika, ale nie zwrócił danych konta."
        );

    }


    /*
     * Zapisujemy użytkownika w pamięci.
     */

    albumCurrentUser =
        result.data.user;


    console.log(
        "AUTH 9.0 — LOGOWANIE OK:",
        albumCurrentUser.id
    );


    return albumCurrentUser;

}


window.loginUser =
    loginUser;


/* =========================================================
   WYLOGOWANIE
   ========================================================= */

async function logoutUser() {

    try {

        const result =
            await albumSupabase.auth.signOut();


        if (
            result.error
        ) {

            throw result.error;

        }


        albumCurrentUser =
            null;


        console.log(
            "AUTH 9.0 — wylogowano."
        );


        return true;

    }

    catch (error) {

        console.error(
            "AUTH 9.0 — błąd wylogowania:",
            error
        );


        throw error;

    }

}


window.logoutUser =
    logoutUser;


/* =========================================================
   OBSŁUGA LOGIN.HTML
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        /*
         * Najpierw uruchamiamy system Auth.
         */

        await initializeAuth();


        const loginForm =
            document.getElementById(
                "login-form"
            );


        const loginButton =
            document.getElementById(
                "login-btn"
            );


        const message =
            document.getElementById(
                "auth-message"
            );


        /*
         * Jeżeli nie jesteśmy na login.html,
         * nie robimy nic więcej.
         */

        if (
            !loginForm
        ) {

            return;

        }


        /*
         * Jeżeli użytkownik już jest zalogowany,
         * nie ma sensu pokazywać mu logowania.
         */

        const existingUser =
            await getCurrentUser();


        if (
            existingUser
        ) {

            console.log(
                "AUTH 9.0 — użytkownik już zalogowany."
            );


            window.location.replace(
                "index.html"
            );


            return;

        }


        /*
         * Obsługa formularza.
         */

        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const emailInput =
                    document.getElementById(
                        "login-email"
                    );


                const passwordInput =
                    document.getElementById(
                        "login-password"
                    );


                const email =
                    emailInput
                        ? emailInput.value
                        : "";


                const password =
                    passwordInput
                        ? passwordInput.value
                        : "";


                /*
                 * Czyścimy komunikat.
                 */

                if (
                    message
                ) {

                    message.textContent =
                        "";

                    message.className =
                        "auth-message";

                    message.hidden =
                        true;

                }


                /*
                 * Blokujemy przycisk.
                 */

                if (
                    loginButton
                ) {

                    loginButton.disabled =
                        true;

                    loginButton.textContent =
                        "LOGOWANIE...";

                }


                try {

                    await loginUser(
                        email,
                        password
                    );


                    /*
                     * Sukces.
                     */

                    if (
                        message
                    ) {

                        message.textContent =
                            "Zalogowano. Otwieranie albumu...";

                        message.className =
                            "auth-message success";

                        message.hidden =
                            false;

                    }


                    /*
                     * Krótkie opóźnienie nie jest
                     * potrzebne do działania Auth,
                     * ale pozwala użytkownikowi
                     * zobaczyć komunikat.
                     */

                    window.location.replace(
                        "index.html"
                    );

                }

                catch (error) {

                    console.error(
                        "AUTH 9.0 — logowanie nieudane:",
                        error
                    );


                    let errorText =
                        "Nie udało się zalogować.";


                    if (
                        error &&
                        error.message
                    ) {

                        errorText =
                            error.message;

                    }


                    /*
                     * Typowe komunikaty Supabase
                     * tłumaczymy na polski.
                     */

                    const lowerError =
                        errorText.toLowerCase();


                    if (
                        lowerError.includes(
                            "invalid login credentials"
                        )
                    ) {

                        errorText =
                            "Nieprawidłowy e-mail lub hasło.";

                    }

                    else if (
                        lowerError.includes(
                            "email not confirmed"
                        )
                    ) {

                        errorText =
                            "Adres e-mail nie został jeszcze potwierdzony.";

                    }


                    if (
                        message
                    ) {

                        message.textContent =
                            errorText;

                        message.className =
                            "auth-message error";

                        message.hidden =
                            false;

                    }

                }

                finally {

                    if (
                        loginButton
                    ) {

                        loginButton.disabled =
                            false;

                        loginButton.textContent =
                            "ZALOGUJ SIĘ";

                    }

                }

            }
        );

    }
);


/* =========================================================
   OCHRONA STRON ALBUMU
   ========================================================= */

/*
 * Ta funkcja NIE robi automatycznego redirectu
 * na każdej stronie.
 *
 * script.js samo wykonuje:
 *
 * const currentUser = await getCurrentUser();
 *
 * dzięki czemu mamy jeden punkt kontroli.
 */

async function requireAlbumLogin() {

    const user =
        await getCurrentUser();


    if (
        !user
    ) {

        window.location.replace(
            "login.html"
        );


        return null;

    }


    return user;

}


window.requireAlbumLogin =
    requireAlbumLogin;


/* =========================================================
   GOTOWE
   ========================================================= */

console.log(
    "AUTH 9.0 — system autoryzacji załadowany."
);
