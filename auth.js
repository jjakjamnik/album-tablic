/* =========================================================
   ALBUM TABLIC
   auth.js

   WERSJA 9.1

   - SUPABASE AUTH
   - LOGOWANIE E-MAIL + HASŁO
   - PERSIST SESSION
   - AUTO REFRESH
   - JEDEN KLIENT SUPABASE
   - getCurrentUser() DLA script.js
   - STABILNE ODCZYTYWANIE SESJI PO REDIRECT
   - OCHRONA ALBUMU
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
   SPRAWDZENIE BIBLIOTEKI
   ========================================================= */

if (
    typeof window.supabase === "undefined"
) {

    console.error(
        "ALBUM AUTH 9.1 — Supabase JS nie został załadowany."
    );

}


/* =========================================================
   KLIENT SUPABASE
   ========================================================= */

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
                    true,

                storage:
                    window.localStorage

            }

        }
    );


/*
 * Udostępniamy klienta globalnie.
 */

window.albumSupabase =
    albumSupabase;


/* =========================================================
   CACHE UŻYTKOWNIKA
   ========================================================= */

let albumCurrentUser =
    null;


/* =========================================================
   GOTOWOŚĆ AUTH
   ========================================================= */

let authInitialized =
    false;

let authInitializationPromise =
    null;


/* =========================================================
   INICJALIZACJA
   ========================================================= */

function initializeAuth() {

    if (
        authInitializationPromise
    ) {

        return authInitializationPromise;

    }


    authInitializationPromise =
        (async function () {

            try {

                /*
                 * Najważniejsze:
                 *
                 * czekamy na prawdziwą sesję Supabase.
                 */

                const {
                    data,
                    error
                } =
                    await albumSupabase.auth.getSession();


                if (
                    error
                ) {

                    console.error(
                        "ALBUM AUTH 9.1 — getSession:",
                        error
                    );

                    albumCurrentUser =
                        null;

                }

                else if (
                    data &&
                    data.session &&
                    data.session.user
                ) {

                    albumCurrentUser =
                        data.session.user;


                    console.log(
                        "ALBUM AUTH 9.1 — sesja OK:",
                        albumCurrentUser.id
                    );

                }

                else {

                    albumCurrentUser =
                        null;


                    console.log(
                        "ALBUM AUTH 9.1 — brak sesji."
                    );

                }

            }

            catch (error) {

                console.error(
                    "ALBUM AUTH 9.1 — błąd inicjalizacji:",
                    error
                );

                albumCurrentUser =
                    null;

            }


            authInitialized =
                true;


            return albumCurrentUser;

        })();


    /*
     * Listener zmian sesji.
     *
     * Rejestrujemy go tylko raz.
     */

    albumSupabase.auth.onAuthStateChange(
        function (
            event,
            session
        ) {

            console.log(
                "ALBUM AUTH 9.1 — AUTH EVENT:",
                event
            );


            if (
                session &&
                session.user
            ) {

                albumCurrentUser =
                    session.user;


                console.log(
                    "ALBUM AUTH 9.1 — użytkownik:",
                    albumCurrentUser.id
                );

            }

            else {

                albumCurrentUser =
                    null;

            }

        }
    );


    return authInitializationPromise;

}


/* =========================================================
   GET CURRENT SESSION
   ========================================================= */

async function getCurrentSession() {

    await initializeAuth();


    try {

        const {
            data,
            error
        } =
            await albumSupabase.auth.getSession();


        if (
            error
        ) {

            console.error(
                "ALBUM AUTH 9.1 — getSession error:",
                error
            );

            return null;

        }


        if (
            data &&
            data.session
        ) {

            /*
             * Aktualizujemy cache.
             */

            if (
                data.session.user
            ) {

                albumCurrentUser =
                    data.session.user;

            }


            return data.session;

        }


        return null;

    }

    catch (error) {

        console.error(
            "ALBUM AUTH 9.1 — getSession exception:",
            error
        );

        return null;

    }

}


window.getCurrentSession =
    getCurrentSession;


/* =========================================================
   GET CURRENT USER
   ========================================================= */

async function getCurrentUser() {

    /*
     * Najpierw inicjalizacja.
     */

    await initializeAuth();


    /*
     * ZA KAŻDYM RAZEM pobieramy aktualną sesję
     * z Supabase.
     *
     * Nie polegamy wyłącznie na zmiennej
     * albumCurrentUser.
     */

    try {

        const {
            data,
            error
        } =
            await albumSupabase.auth.getSession();


        if (
            error
        ) {

            console.error(
                "ALBUM AUTH 9.1 — getSession:",
                error
            );

            albumCurrentUser =
                null;

            return null;

        }


        if (
            data &&
            data.session &&
            data.session.user
        ) {

            albumCurrentUser =
                data.session.user;


            console.log(
                "ALBUM AUTH 9.1 — CURRENT USER:",
                albumCurrentUser.id
            );


            return albumCurrentUser;

        }

    }

    catch (error) {

        console.error(
            "ALBUM AUTH 9.1 — session exception:",
            error
        );

    }


    /*
     * Jeżeli sesja nie została jeszcze
     * poprawnie odczytana, próbujemy getUser().
     */

    try {

        const {
            data,
            error
        } =
            await albumSupabase.auth.getUser();


        if (
            !error &&
            data &&
            data.user
        ) {

            albumCurrentUser =
                data.user;


            console.log(
                "ALBUM AUTH 9.1 — GET USER:",
                albumCurrentUser.id
            );


            return albumCurrentUser;

        }

    }

    catch (error) {

        console.error(
            "ALBUM AUTH 9.1 — getUser exception:",
            error
        );

    }


    /*
     * Ostatnia próba.
     *
     * Czasami przeglądarka potrzebuje chwili
     * po przejściu login → index.
     */

    await new Promise(
        function (resolve) {

            setTimeout(
                resolve,
                150
            );

        }
    );


    try {

        const {
            data
        } =
            await albumSupabase.auth.getSession();


        if (
            data &&
            data.session &&
            data.session.user
        ) {

            albumCurrentUser =
                data.session.user;


            console.log(
                "ALBUM AUTH 9.1 — SESJA ODNALEZIONA PO RETRY:",
                albumCurrentUser.id
            );


            return albumCurrentUser;

        }

    }

    catch (error) {

        console.error(
            "ALBUM AUTH 9.1 — retry error:",
            error
        );

    }


    albumCurrentUser =
        null;


    console.log(
        "ALBUM AUTH 9.1 — BRAK ZALOGOWANEGO UŻYTKOWNIKA."
    );


    return null;

}


window.getCurrentUser =
    getCurrentUser;


/* =========================================================
   LOGOWANIE
   ========================================================= */

async function loginUser(
    email,
    password
) {

    const cleanEmail =
        String(
            email || ""
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
        "ALBUM AUTH 9.1 — LOGOWANIE:",
        cleanEmail
    );


    const {
        data,
        error
    } =
        await albumSupabase.auth.signInWithPassword(
            {
                email:
                    cleanEmail,

                password:
                    password
            }
        );


    if (
        error
    ) {

        console.error(
            "ALBUM AUTH 9.1 — BŁĄD LOGOWANIA:",
            error
        );

        throw error;

    }


    if (
        !data ||
        !data.session ||
        !data.user
    ) {

        throw new Error(
            "Logowanie nie zwróciło aktywnej sesji."
        );

    }


    /*
     * Natychmiast zapisujemy użytkownika.
     */

    albumCurrentUser =
        data.user;


    console.log(
        "ALBUM AUTH 9.1 — LOGOWANIE OK:",
        albumCurrentUser.id
    );


    /*
     * Sprawdzamy jeszcze raz sesję,
     * zanim pozwolimy stronie zrobić redirect.
     */

    const session =
        await getCurrentSession();


    if (
        !session ||
        !session.user
    ) {

        throw new Error(
            "Logowanie zakończone, ale nie udało się odczytać sesji."
        );

    }


    albumCurrentUser =
        session.user;


    return albumCurrentUser;

}


window.loginUser =
    loginUser;


/* =========================================================
   WYLOGOWANIE
   ========================================================= */

async function logoutUser() {

    const {
        error
    } =
        await albumSupabase.auth.signOut(
            {
                scope:
                    "local"
            }
        );


    if (
        error
    ) {

        console.error(
            "ALBUM AUTH 9.1 — BŁĄD WYLOGOWANIA:",
            error
        );

        throw error;

    }


    albumCurrentUser =
        null;


    console.log(
        "ALBUM AUTH 9.1 — WYLOGOWANO."
    );


    return true;

}


window.logoutUser =
    logoutUser;


/* =========================================================
   LOGIN.HTML
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        /*
         * Uruchamiamy Auth.
         */

        await initializeAuth();


        const loginForm =
            document.getElementById(
                "login-form"
            );


        /*
         * Jeżeli to nie login.html,
         * kończymy.
         */

        if (
            !loginForm
        ) {

            return;

        }


        const loginButton =
            document.getElementById(
                "login-btn"
            );


        const message =
            document.getElementById(
                "auth-message"
            );


        /*
         * Jeżeli użytkownik już ma sesję,
         * nie pokazujemy mu logowania.
         */

        const existingUser =
            await getCurrentUser();


        if (
            existingUser
        ) {

            console.log(
                "ALBUM AUTH 9.1 — JUŻ ZALOGOWANY:",
                existingUser.id
            );


            window.location.replace(
                "index.html"
            );


            return;

        }


        /* =================================================
           FORMULARZ
           ================================================= */

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
                 * Czyszczenie komunikatu.
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
                 * Blokada przycisku.
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

                    /*
                     * LOGOWANIE
                     */

                    await loginUser(
                        email,
                        password
                    );


                    console.log(
                        "ALBUM AUTH 9.1 — REDIRECT DO INDEX"
                    );


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
                     * Redirect dopiero po potwierdzeniu
                     * aktywnej sesji.
                     */

                    window.location.replace(
                        "index.html"
                    );

                }

                catch (error) {

                    console.error(
                        "ALBUM AUTH 9.1 — LOGOWANIE NIEUDANE:",
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
   OCHRONA ALBUMU
   ========================================================= */

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
    "ALBUM AUTH 9.1 — SYSTEM AUTORYZACJI ZAŁADOWANY."
);
