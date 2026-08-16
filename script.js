/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   script.js
   WERSJA 8.2 — SUPABASE + UŻYTKOWNICY

   - SUPABASE JAKO GŁÓWNA BAZA DANYCH
   - KAŻDY UŻYTKOWNIK MA WŁASNĄ KOLEKCJĘ
   - KOMPUTER + TELEFON = TA SAMA KOLEKCJA
   - AUTOMATYCZNA MIGRACJA STAREGO LOCALSTORAGE
   - ODLEGŁOŚĆ DROGOWA OSRM
   - STAŁA RZADKOŚĆ DLA KRAJÓW
   - FRANCJA — WYBÓR DEPARTAMENTU
   - FRANCJA — PREFEKTURA JAKO PUNKT POCHODZENIA
   - FRANCJA — KOD DEPARTAMENTU Z PRAWEJ STRONY TABLICY
   - SŁOWACJA — FALLBACK ★★
   - IRLANDIA — ROZPOZNAWANIE KODU HRABSTWA
   - AUTOMATYCZNA AKTUALIZACJA STARYCH KART
   - KOLOR KARTY WYNIKA Z GWIAZDEK
   - SPECIAL = ZŁOTA KARTA
   - EDYCJA KART
   - DUPLIKATY NIE SĄ DODAWANE
   - KAŻDY UŻYTKOWNIK WIDZI TYLKO SWOJE KARTY
   - NOWY UŻYTKOWNIK STARTUJE Z 0 NAKLEJEK
   ========================================================= */


/* =========================================================
   SUPABASE — KONFIGURACJA
   ========================================================= */

const SUPABASE_URL =
    "https://ddlwmtbtsaikbkorkwaa.supabase.co/rest/v1";

const SUPABASE_KEY =
    "sb_publishable_i9lPlpSiRH5wLzI8QJ_gcA_-n0IZNL2";

const SUPABASE_TABLE =
    "stickers";


/* =========================================================
   STARE LOCALSTORAGE
   UŻYWANE TYLKO DO JEDNORAZOWEJ MIGRACJI
   ========================================================= */

const STORAGE_KEY =
    "albumStickers";

const STORAGE_VERSION_KEY =
    "albumStorageVersion";

const STORAGE_VERSION =
    "8.2";

const MIGRATION_KEY =
    "albumMigrationV8_2";


/* =========================================================
   CACHE NAKLEJEK
   ========================================================= */

let stickersCache = [];

let stickersLoaded = false;


/* =========================================================
   AKTUALNY UŻYTKOWNIK
   ========================================================= */

let currentUser = null;


/* =========================================================
   AKTUALNIE EDYTOWANA KARTA
   ========================================================= */

let editingStickerId =
    null;


/* =========================================================
   STAŁA RZADKOŚĆ KRAJÓW
   ========================================================= */

const FIXED_COUNTRY_STARS = {

    "SE": 1,
    "DK": 1,

    "NL": 2,
    "LV": 2,
    "LT": 2,

    "FI": 3,
    "ES": 3,
    "BE": 3,
    "EE": 3,

    "PT": 4,
    "GR": 4,

    "IT": 4,

    "AL": 5,
    "IS": 5

};


/* =========================================================
   FALLBACK RZADKOŚCI
   ========================================================= */

const FALLBACK_COUNTRY_STARS = {

    "SK": 2

};


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        initializeAlbum();


        /* =================================================
           SPRAWDZENIE ZALOGOWANEGO UŻYTKOWNIKA
           ================================================= */

        try {

            currentUser =
                await getCurrentUserForAlbum();


            if (!currentUser) {

                window.location.href =
                    "login.html";

                return;

            }

        }

        catch (error) {

            console.error(
                "Błąd sprawdzania użytkownika:",
                error
            );

            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "Zalogowany użytkownik:",
            currentUser.id
        );


        /* =================================================
           WCZYTANIE BAZY SUPABASE
           ================================================= */

        try {

            await loadStickersFromSupabase();

        }

        catch (error) {

            console.error(
                "Błąd połączenia z Supabase:",
                error
            );

            alert(
                "Nie udało się połączyć z bazą albumu.\n\n" +
                "Sprawdź połączenie z internetem."
            );

            if (
                typeof window.albumSplashReady ===
                "function"
            ) {

                window.albumSplashReady();

            }

            return;

        }


        /* =================================================
           MIGRACJA STAREGO LOCALSTORAGE
           ================================================= */

        await migrateOldStickers();


        /* =================================================
           ELEMENTY FORMULARZA
           ================================================= */

        const addButton =
            document.getElementById(
                "add-sticker-btn"
            );

        const form =
            document.getElementById(
                "sticker-form"
            );

        const saveButton =
            document.getElementById(
                "save-sticker-btn"
            );

        const countrySelect =
            document.getElementById(
                "sticker-country"
            );

        const plateInput =
            document.getElementById(
                "sticker-plate"
            );

        const locationInput =
            document.getElementById(
                "sticker-location"
            );

        const ownerSelect =
            document.getElementById(
                "sticker-owner"
            );


        /* =================================================
           OTWIERANIE FORMULARZA
           ================================================= */

        if (
            addButton &&
            form
        ) {

            addButton.addEventListener(
                "click",
                function () {

                    if (
                        form.hasAttribute(
                            "hidden"
                        )
                    ) {

                        form.removeAttribute(
                            "hidden"
                        );

                        addButton.textContent =
                            "− ZAMKNIJ";

                        createFrenchDepartmentSelect();

                    }

                    else {

                        form.setAttribute(
                            "hidden",
                            ""
                        );

                        addButton.textContent =
                            "+ DODAJ TABLICĘ";

                        resetEditMode();

                    }

                }
            );

        }


        /* =================================================
           ROZPOZNAWANIE TABLICY
           ================================================= */

        if (
            plateInput &&
            countrySelect
        ) {

            plateInput.addEventListener(
                "input",
                function () {

                    const plate =
                        plateInput.value.trim();


                    if (!plate) {
                        return;
                    }


                    const frenchDepartmentSelect =
                        document.getElementById(
                            "french-department"
                        );


                    const frenchDepartment =
                        countrySelect.value === "FR" &&
                        frenchDepartmentSelect
                            ? frenchDepartmentSelect.value
                            : "";


                    findCity(
                        countrySelect.value,
                        plate,
                        frenchDepartment
                    );

                }
            );

        }


        /* =================================================
           ZMIANA KRAJU
           ================================================= */

        if (
            countrySelect &&
            plateInput
        ) {

            countrySelect.addEventListener(
                "change",
                function () {

                    createFrenchDepartmentSelect();


                    const plate =
                        plateInput.value.trim();


                    if (!plate) {
                        return;
                    }


                    const frenchDepartmentSelect =
                        document.getElementById(
                            "french-department"
                        );


                    const frenchDepartment =
                        countrySelect.value === "FR" &&
                        frenchDepartmentSelect
                            ? frenchDepartmentSelect.value
                            : "";


                    findCity(
                        countrySelect.value,
                        plate,
                        frenchDepartment
                    );

                }
            );

        }


        /* =================================================
           ZAPIS / EDYCJA
           ================================================= */

        if (saveButton) {

            saveButton.addEventListener(
                "click",
                async function () {

                    const country =
                        countrySelect
                            ? countrySelect.value
                            : "";


                    const plate =
                        plateInput
                            ? plateInput.value
                                .trim()
                                .toUpperCase()
                            : "";


                    const location =
                        locationInput
                            ? locationInput.value.trim()
                            : "";


                    const owner =
                        ownerSelect
                            ? ownerSelect.value
                            : "green";


                    /* -------------------------------------
                       FRANCJA
                       ------------------------------------- */

                    const frenchDepartmentSelect =
                        document.getElementById(
                            "french-department"
                        );


                    const frenchDepartment =
                        country === "FR" &&
                        frenchDepartmentSelect
                            ? frenchDepartmentSelect.value
                            : "";


                    /* -------------------------------------
                       WALIDACJA KRAJU
                       ------------------------------------- */

                    if (!country) {

                        alert(
                            "Wybierz kraj."
                        );

                        return;

                    }


                    /* -------------------------------------
                       WALIDACJA TABLICY
                       ------------------------------------- */

                    if (!plate) {

                        alert(
                            "Wpisz numer tablicy."
                        );

                        if (plateInput) {
                            plateInput.focus();
                        }

                        return;

                    }


                    /* -------------------------------------
                       WALIDACJA MIEJSCA
                       ------------------------------------- */

                    if (!location) {

                        alert(
                            "Wpisz miejsce, w którym znalazłeś tablicę."
                        );

                        if (locationInput) {
                            locationInput.focus();
                        }

                        return;

                    }


                    /* -------------------------------------
                       FRANCJA
                       ------------------------------------- */

                    if (
                        country === "FR" &&
                        !frenchDepartment
                    ) {

                        alert(
                            "Wybierz departament dla francuskiej tablicy."
                        );

                        if (
                            frenchDepartmentSelect
                        ) {

                            frenchDepartmentSelect.focus();

                        }

                        return;

                    }


                    /* =================================================
                       DUPLIKAT
                       ================================================= */

                    const duplicate =
                        findDuplicateSticker(
                            country,
                            plate,
                            editingStickerId
                        );


                    if (duplicate) {

                        alert(
                            "Ta tablica jest już w kolekcji!\n\n" +
                            country +
                            " " +
                            plate +
                            "\n\n" +
                            "Nie dodaję duplikatu."
                        );

                        return;

                    }


                    /* =================================================
                       POCHODZENIE
                       ================================================= */

                    const detectedCity =
                        findCity(
                            country,
                            plate,
                            frenchDepartment
                        );


                    /* =================================================
                       STAŁA RZADKOŚĆ
                       ================================================= */

                    const fixedStars =
                        getFixedCountryStars(
                            country
                        );


                    /* =================================================
                       FALLBACK
                       ================================================= */

                    const fallbackStars =
                        getFallbackCountryStars(
                            country
                        );


                    /* =================================================
                       BRAK POCHODZENIA
                       ================================================= */

                    if (
                        !detectedCity &&
                        fixedStars === null &&
                        fallbackStars === null
                    ) {

                        const continueWithoutOrigin =
                            confirm(
                                "Nie udało się rozpoznać miejscowości pochodzenia tablicy.\n\n" +
                                "Tablica zostanie dodana bez automatycznej odległości.\n\n" +
                                "Czy chcesz kontynuować?"
                            );


                        if (
                            !continueWithoutOrigin
                        ) {

                            return;

                        }

                    }


                    /* =================================================
                       BLOKADA PRZYCISKU
                       ================================================= */

                    saveButton.disabled =
                        true;


                    const oldButtonText =
                        saveButton.textContent;


                    saveButton.textContent =
                        "OBLICZANIE ODLEGŁOŚCI...";


                    /* =================================================
                       ODLEGŁOŚĆ
                       ================================================= */

                    let distanceResult =
                        null;


                    /* =================================================
                       KRAJ STAŁY
                       ================================================= */

                    if (
                        fixedStars !== null
                    ) {

                        distanceResult = {

                            kilometers:
                                null,

                            distanceText:
                                null,

                            stars:
                                fixedStars,

                            starsText:
                                "★".repeat(
                                    fixedStars
                                )

                        };

                    }


                    /* =================================================
                       FALLBACK
                       ================================================= */

                    else if (
                        !detectedCity &&
                        fallbackStars !== null
                    ) {

                        distanceResult = {

                            kilometers:
                                null,

                            distanceText:
                                null,

                            stars:
                                fallbackStars,

                            starsText:
                                "★".repeat(
                                    fallbackStars
                                )

                        };

                    }


                    /* =================================================
                       NORMALNE LICZENIE
                       ================================================= */

                    else if (
                        detectedCity
                    ) {

                        try {

                            distanceResult =
                                await calculateStickerDistance(
                                    country,
                                    detectedCity,
                                    location
                                );

                        }

                        catch (error) {

                            console.error(
                                "Błąd obliczania odległości:",
                                error
                            );

                            distanceResult =
                                null;

                        }

                    }


                    /* =================================================
                       PRZYCISK
                       ================================================= */

                    saveButton.disabled =
                        false;


                    saveButton.textContent =
                        oldButtonText;


                    /* =================================================
                       EDYCJA
                       ================================================= */

                    if (
                        editingStickerId
                    ) {

                        const index =
                            stickersCache.findIndex(
                                function (sticker) {

                                    return (
                                        String(sticker.id) ===
                                        String(editingStickerId)
                                    );

                                }
                            );


                        if (
                            index !== -1
                        ) {

                            const oldSticker =
                                stickersCache[index];


                            const updatedSticker = {

                                ...oldSticker,

                                user_id:
                                    currentUser.id,

                                country:
                                    country,

                                plate:
                                    plate,

                                location:
                                    location,

                                origin:
                                    detectedCity ||
                                    "",

                                department:
                                    country === "FR"
                                        ? frenchDepartment
                                        : oldSticker.department || "",

                                owner:
                                    owner,

                                kilometers:
                                    distanceResult
                                        ? distanceResult.kilometers
                                        : null,

                                stars:
                                    distanceResult
                                        ? distanceResult.stars
                                        : 0

                            };


                            try {

                                await updateStickerInSupabase(
                                    updatedSticker
                                );

                                stickersCache[index] =
                                    updatedSticker;

                            }

                            catch (error) {

                                console.error(
                                    "Błąd aktualizacji naklejki:",
                                    error
                                );

                                alert(
                                    "Nie udało się zapisać zmian w bazie.\n\n" +
                                    error.message
                                );

                                return;

                            }

                        }


                        editingStickerId =
                            null;


                        let message =
                            "Tablica została zaktualizowana!\n\n" +
                            country +
                            " " +
                            plate +
                            "\nZnaleziono: " +
                            location;


                        if (
                            country === "FR" &&
                            frenchDepartment
                        ) {

                            message +=
                                "\nDepartament: " +
                                frenchDepartment;

                        }


                        if (
                            detectedCity
                        ) {

                            message +=
                                "\nPochodzenie: " +
                                detectedCity;

                        }


                        if (
                            fixedStars !== null ||
                            fallbackStars !== null
                        ) {

                            const stars =
                                fixedStars !== null
                                    ? fixedStars
                                    : fallbackStars;


                            message +=
                                "\nRzadkość: " +
                                "★".repeat(
                                    stars
                                );

                        }

                        else if (
                            distanceResult
                        ) {

                            message +=
                                "\nOdległość drogowa: " +
                                distanceResult.distanceText +
                                "\nRzadkość: " +
                                distanceResult.starsText;

                        }


                        alert(
                            message
                        );

                    }


                    /* =================================================
                       NOWA KARTA
                       ================================================= */

                    else {

                        const sticker = {

                            id:
                                generateStickerId(),

                            user_id:
                                currentUser.id,

                            country:
                                country,

                            plate:
                                plate,

                            location:
                                location,

                            origin:
                                detectedCity ||
                                "",

                            department:
                                country === "FR"
                                    ? frenchDepartment
                                    : "",

                            owner:
                                owner,

                            date:
                                new Date()
                                    .toISOString(),

                            kilometers:
                                distanceResult
                                    ? distanceResult.kilometers
                                    : null,

                            stars:
                                distanceResult
                                    ? distanceResult.stars
                                    : 0

                        };


                        try {

                            await saveSticker(
                                sticker
                            );

                        }

                        catch (error) {

                            console.error(
                                "Błąd zapisu naklejki:",
                                error
                            );

                            alert(
                                "Nie udało się zapisać naklejki w bazie.\n\n" +
                                error.message
                            );

                            return;

                        }


                        let message =
                            "Tablica została dodana do kolekcji!\n\n" +
                            country +
                            " " +
                            plate +
                            "\nZnaleziono: " +
                            location;


                        if (
                            country === "FR" &&
                            frenchDepartment
                        ) {

                            message +=
                                "\nDepartament: " +
                                frenchDepartment;

                        }


                        if (
                            detectedCity
                        ) {

                            message +=
                                "\nPochodzenie: " +
                                detectedCity;

                        }


                        if (
                            fixedStars !== null ||
                            fallbackStars !== null
                        ) {

                            const stars =
                                fixedStars !== null
                                    ? fixedStars
                                    : fallbackStars;


                            message +=
                                "\nRzadkość: " +
                                "★".repeat(
                                    stars
                                );

                        }

                        else if (
                            distanceResult
                        ) {

                            message +=
                                "\nOdległość drogowa: " +
                                distanceResult.distanceText +
                                "\nRzadkość: " +
                                distanceResult.starsText;

                        }

                        else {

                            message +=
                                "\nOdległość: nie udało się obliczyć.";

                        }


                        alert(
                            message
                        );

                    }


                    /* =================================================
                       CZYSZCZENIE
                       ================================================= */

                    if (plateInput) {

                        plateInput.value =
                            "";

                    }


                    if (locationInput) {

                        locationInput.value =
                            "";

                    }


                    if (form) {

                        form.setAttribute(
                            "hidden",
                            ""
                        );

                    }


                    if (addButton) {

                        addButton.textContent =
                            "+ DODAJ TABLICĘ";

                    }


                    const frenchWrapper =
                        document.getElementById(
                            "french-department-wrapper"
                        );


                    if (
                        frenchWrapper
                    ) {

                        frenchWrapper.remove();

                    }


                    editingStickerId =
                        null;


                    updateCountryCounters();

                    updateCountryCardStates();

                    renderCurrentCountry();

                }
            );

        }


        /* =================================================
           PIERWSZE RENDEROWANIE
           ================================================= */

        createFrenchDepartmentSelect();

        updateCountryCounters();

        updateCountryCardStates();

        renderCurrentCountry();


        /* =================================================
           EKRAN STARTOWY — ALBUM GOTOWY
           ================================================= */

        if (
            typeof window.albumSplashReady ===
            "function"
        ) {

            window.albumSplashReady();

        }

    }
);


/* =========================================================
   AKTUALNY UŻYTKOWNIK — SUPABASE AUTH
   ========================================================= */

async function getCurrentUserForAlbum() {

    const response =
        await fetch(
            "https://ddlwmtbtsaikbkorkwaa.supabase.co/auth/v1/user",
            {
                method:
                    "GET",

                headers: {

                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        "Bearer " +
                        SUPABASE_KEY

                }

            }
        );


    /*
     * Powyższe REST API nie posiada
     * sesji użytkownika zapisanej
     * automatycznie w tym fetchu.
     *
     * Dlatego korzystamy z Supabase
     * clienta z auth.js.
     */

    if (
        typeof supabaseClient !==
        "undefined"
    ) {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (error) {

            throw error;

        }


        return data.user || null;

    }


    /*
     * Jeżeli auth.js nie jest załadowany,
     * nie wpuszczamy do albumu.
     */

    return null;

}


/* =========================================================
   SUPABASE — NAGŁÓWKI
   ========================================================= */

function supabaseHeaders(
    extraHeaders = {}
) {

    return {

        "apikey":
            SUPABASE_KEY,

        "Authorization":
            "Bearer " +
            SUPABASE_KEY,

        "Content-Type":
            "application/json",

        ...extraHeaders

    };

}


/* =========================================================
   SUPABASE — POBIERANIE NAKLEJEK AKTUALNEGO UŻYTKOWNIKA
   ========================================================= */

async function loadStickersFromSupabase() {

    if (!currentUser) {

        throw new Error(
            "Brak zalogowanego użytkownika."
        );

    }


    const url =
        SUPABASE_URL +
        "/" +
        SUPABASE_TABLE +
        "?select=*" +
        "&user_id=eq." +
        encodeURIComponent(
            currentUser.id
        );


    const response =
        await fetch(
            url,
            {
                method:
                    "GET",

                headers:
                    supabaseHeaders()
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            "Supabase HTTP " +
            response.status +
            ": " +
            errorText
        );

    }


    const data =
        await response.json();


    if (
        !Array.isArray(data)
    ) {

        throw new Error(
            "Supabase zwrócił nieprawidłowe dane."
        );

    }


    stickersCache =
        data;


    stickersLoaded =
        true;


    console.log(
        "Supabase: wczytano",
        stickersCache.length,
        "naklejek użytkownika."
    );

}


/* =========================================================
   SUPABASE — DODAWANIE
   ========================================================= */

async function saveSticker(
    sticker
) {

    if (!currentUser) {

        throw new Error(
            "Brak zalogowanego użytkownika."
        );

    }


    sticker.user_id =
        currentUser.id;


    const url =
        SUPABASE_URL +
        "/" +
        SUPABASE_TABLE;


    const response =
        await fetch(
            url,
            {
                method:
                    "POST",

                headers:
                    supabaseHeaders(
                        {
                            "Prefer":
                                "return=representation"
                        }
                    ),

                body:
                    JSON.stringify(
                        sticker
                    )
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            "Supabase HTTP " +
            response.status +
            ": " +
            errorText
        );

    }


    const data =
        await response.json();


    if (
        Array.isArray(data) &&
        data.length
    ) {

        stickersCache.push(
            data[0]
        );

    }

    else {

        stickersCache.push(
            sticker
        );

    }


    console.log(
        "Supabase: dodano",
        sticker.country,
        sticker.plate
    );

}


/* =========================================================
   SUPABASE — EDYCJA
   ========================================================= */

async function updateStickerInSupabase(
    sticker
) {

    if (!currentUser) {

        throw new Error(
            "Brak zalogowanego użytkownika."
        );

    }


    const url =
        SUPABASE_URL +
        "/" +
        SUPABASE_TABLE +
        "?id=eq." +
        encodeURIComponent(
            sticker.id
        ) +
        "&user_id=eq." +
        encodeURIComponent(
            currentUser.id
        );


    const response =
        await fetch(
            url,
            {
                method:
                    "PATCH",

                headers:
                    supabaseHeaders(
                        {
                            "Prefer":
                                "return=representation"
                        }
                    ),

                body:
                    JSON.stringify(
                        {
                            user_id:
                                currentUser.id,

                            country:
                                sticker.country,

                            plate:
                                sticker.plate,

                            location:
                                sticker.location,

                            origin:
                                sticker.origin,

                            department:
                                sticker.department,

                            owner:
                                sticker.owner,

                            date:
                                sticker.date,

                            kilometers:
                                sticker.kilometers,

                            stars:
                                sticker.stars
                        }
                    )
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            "Supabase HTTP " +
            response.status +
            ": " +
            errorText
        );

    }


    console.log(
        "Supabase: zaktualizowano",
        sticker.country,
        sticker.plate
    );

}


/* =========================================================
   SUPABASE — USUWANIE
   ========================================================= */

async function deleteStickerFromSupabase(
    sticker
) {

    if (!currentUser) {

        throw new Error(
            "Brak zalogowanego użytkownika."
        );

    }


    const url =
        SUPABASE_URL +
        "/" +
        SUPABASE_TABLE +
        "?id=eq." +
        encodeURIComponent(
            sticker.id
        ) +
        "&user_id=eq." +
        encodeURIComponent(
            currentUser.id
        );


    const response =
        await fetch(
            url,
            {
                method:
                    "DELETE",

                headers:
                    supabaseHeaders()
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            "Supabase HTTP " +
            response.status +
            ": " +
            errorText
        );

    }


    console.log(
        "Supabase: usunięto",
        sticker.country,
        sticker.plate
    );

}


/* =========================================================
   FRANCJA — WYBÓR DEPARTAMENTU
   ========================================================= */

function createFrenchDepartmentSelect() {

    const countrySelect =
        document.getElementById(
            "sticker-country"
        );


    const plateInput =
        document.getElementById(
            "sticker-plate"
        );


    if (
        !countrySelect ||
        !plateInput
    ) {

        return;

    }


    let existing =
        document.getElementById(
            "french-department-wrapper"
        );


    if (
        countrySelect.value !== "FR"
    ) {

        if (existing) {
            existing.remove();
        }

        return;

    }


    if (existing) {
        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.id =
        "french-department-wrapper";


    wrapper.className =
        "french-department-wrapper";


    const label =
        document.createElement(
            "label"
        );


    label.textContent =
        "DEPARTAMENT";


    label.setAttribute(
        "for",
        "french-department"
    );


    const select =
        document.createElement(
            "select"
        );


    select.id =
        "french-department";


    select.name =
        "french-department";


    const emptyOption =
        document.createElement(
            "option"
        );


    emptyOption.value =
        "";


    emptyOption.textContent =
        "— WYBIERZ DEPARTAMENT —";


    select.appendChild(
        emptyOption
    );


    if (
        typeof FRANCJA_KODY !==
        "undefined"
    ) {

        const codes =
            Object.keys(
                FRANCJA_KODY
            ).sort(
                function (a, b) {

                    return a.localeCompare(
                        b,
                        "fr",
                        {
                            numeric: true
                        }
                    );

                }
            );


        codes.forEach(
            function (code) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    code;


                option.textContent =
                    code +
                    " — " +
                    FRANCJA_KODY[code];


                select.appendChild(
                    option
                );

            }
        );

    }


    wrapper.appendChild(
        label
    );


    wrapper.appendChild(
        select
    );


    const countryField =
        countrySelect.parentElement;


    if (
        countryField &&
        countryField.parentElement
    ) {

        countryField.parentElement.insertBefore(
            wrapper,
            plateInput.parentElement
        );

    }


    select.addEventListener(
        "change",
        function () {

            const plate =
                plateInput.value.trim();


            if (!plate) {
                return;
            }


            findCity(
                "FR",
                plate,
                select.value
            );

        }
    );

}


/* =========================================================
   INICJALIZACJA
   ========================================================= */

function initializeAlbum() {

    const currentVersion =
        localStorage.getItem(
            STORAGE_VERSION_KEY
        );


    if (
        currentVersion !==
        STORAGE_VERSION
    ) {

        localStorage.setItem(
            STORAGE_VERSION_KEY,
            STORAGE_VERSION
        );

    }

}


/* =========================================================
   STAŁA RZADKOŚĆ KRAJU
   ========================================================= */

function getFixedCountryStars(
    country
) {

    if (
        Object.prototype.hasOwnProperty.call(
            FIXED_COUNTRY_STARS,
            country
        )
    ) {

        return FIXED_COUNTRY_STARS[
            country
        ];

    }


    return null;

}


/* =========================================================
   FALLBACK RZADKOŚCI
   ========================================================= */

function getFallbackCountryStars(
    country
) {

    if (
        Object.prototype.hasOwnProperty.call(
            FALLBACK_COUNTRY_STARS,
            country
        )
    ) {

        return FALLBACK_COUNTRY_STARS[
            country
        ];

    }


    return null;

}


/* =========================================================
   ROZPOZNAWANIE POCHODZENIA TABLICY
   ========================================================= */

function findCity(
    country,
    plate,
    frenchDepartment = ""
) {

    if (
        !country ||
        !plate
    ) {

        return null;

    }


    const cleanPlate =
        plate
            .toUpperCase()
            .replace(
                /[\s-]/g,
                ""
            );


    if (!cleanPlate) {
        return null;
    }


    const databases = {

        "PL":
            typeof POLSKA_KODY !== "undefined"
                ? POLSKA_KODY
                : null,

        "DE":
            typeof NIEMCY_KODY !== "undefined"
                ? NIEMCY_KODY
                : null,

        "RO":
            typeof RUMUNIA_KODY !== "undefined"
                ? RUMUNIA_KODY
                : null,

        "UA":
            typeof UKRAINA_KODY !== "undefined"
                ? UKRAINA_KODY
                : null,

        "CZ":
            typeof CZECHY_KODY !== "undefined"
                ? CZECHY_KODY
                : null,

        "DK":
            typeof DANIA_KODY !== "undefined"
                ? DANIA_KODY
                : null,

        "SE":
            typeof SZWECJA_KODY !== "undefined"
                ? SZWECJA_KODY
                : null,

        "NL":
            typeof HOLANDIA_KODY !== "undefined"
                ? HOLANDIA_KODY
                : null,

        "FR":
            typeof FRANCJA_KODY !== "undefined"
                ? FRANCJA_KODY
                : null,

        "PT":
            typeof PORTUGALIA_KODY !== "undefined"
                ? PORTUGALIA_KODY
                : null,

        "IT":
            typeof WLOCHY_KODY !== "undefined"
                ? WLOCHY_KODY
                : null,

        "ES":
            typeof HISZPANIA_KODY !== "undefined"
                ? HISZPANIA_KODY
                : null,

        "NO":
            typeof NORWEGIA_KODY !== "undefined"
                ? NORWEGIA_KODY
                : null,

        "FI":
            typeof FINLANDIA_KODY !== "undefined"
                ? FINLANDIA_KODY
                : null,

        "BE":
            typeof BELGIA_KODY !== "undefined"
                ? BELGIA_KODY
                : null,

        "AT":
            typeof AUSTRIA_KODY !== "undefined"
                ? AUSTRIA_KODY
                : null,

        "CH":
            typeof SZWAJCARIA_KODY !== "undefined"
                ? SZWAJCARIA_KODY
                : null,

        "HU":
            typeof WEGRY_KODY !== "undefined"
                ? WEGRY_KODY
                : null,

        "SK":
            typeof SLOWACJA_KODY !== "undefined"
                ? SLOWACJA_KODY
                : null,

        "SI":
            typeof SLOWENIA_KODY !== "undefined"
                ? SLOWENIA_KODY
                : null,

        "HR":
            typeof CHORWACJA_KODY !== "undefined"
                ? CHORWACJA_KODY
                : null,

        "XK":
            typeof KOSOWO_KODY !== "undefined"
                ? KOSOWO_KODY
                : null,

        "BG":
            typeof BULGARIA_KODY !== "undefined"
                ? BULGARIA_KODY
                : null,

        "GR":
            typeof GRECJA_KODY !== "undefined"
                ? GRECJA_KODY
                : null,

        "AL":
            typeof ALBANIA_KODY !== "undefined"
                ? ALBANIA_KODY
                : null,

        "EE":
            typeof ESTONIA_KODY !== "undefined"
                ? ESTONIA_KODY
                : null,

        "LV":
            typeof LOTWA_KODY !== "undefined"
                ? LOTWA_KODY
                : null,

        "LT":
            typeof LITWA_KODY !== "undefined"
                ? LITWA_KODY
                : null,

        "IS":
            typeof ISLANDIA_KODY !== "undefined"
                ? ISLANDIA_KODY
                : null,

        "IE":
            typeof IRLANDIA_KODY !== "undefined"
                ? IRLANDIA_KODY
                : null,

        "GB":
            typeof WIELKA_BRYTANIA_KODY !== "undefined"
                ? WIELKA_BRYTANIA_KODY
                : null,

        "BY":
            typeof BIALORUS_KODY !== "undefined"
                ? BIALORUS_KODY
                : null

    };


    const database =
        databases[country];


    if (!database) {
        return null;
    }


    /* =====================================================
       FRANCJA
       ===================================================== */

    if (
        country === "FR"
    ) {

        if (
            frenchDepartment
        ) {

            const departmentCode =
                frenchDepartment
                    .toUpperCase()
                    .replace(
                        /[\s-]/g,
                        ""
                    );


            if (
                database[departmentCode]
            ) {

                return database[
                    departmentCode
                ];

            }

        }


        const frenchCodes =
            Object.keys(database)
                .sort(
                    function (a, b) {

                        return (
                            b.length -
                            a.length
                        );

                    }
                );


        for (
            const code of frenchCodes
        ) {

            const cleanCode =
                code
                    .toUpperCase()
                    .replace(
                        /[\s-]/g,
                        ""
                    );


            if (
                cleanPlate.endsWith(
                    cleanCode
                )
            ) {

                return database[
                    code
                ];

            }

        }


        return null;

    }


    /* =====================================================
       IRLANDIA
       ===================================================== */

    if (
        country === "IE"
    ) {

        return findIrishCounty(
            cleanPlate,
            database
        );

    }


    /* =====================================================
       WIELKA BRYTANIA
       ===================================================== */

    if (
        country === "GB"
    ) {

        const gbCode =
            cleanPlate.substring(
                0,
                2
            );


        if (
            database[gbCode]
        ) {

            return database[
                gbCode
            ];

        }


        return null;

    }


    /* =====================================================
       BIAŁORUŚ
       ===================================================== */

    if (
        country === "BY"
    ) {

        const regionCode =
            cleanPlate.slice(-1);


        if (
            database[regionCode]
        ) {

            return database[
                regionCode
            ];

        }


        return null;

    }


    return findCodeInDatabase(
        cleanPlate,
        database
    );

}


/* =========================================================
   IRLANDIA — SZUKANIE HRABSTWA
   ========================================================= */

function findIrishCounty(
    cleanPlate,
    database
) {

    if (
        !cleanPlate ||
        !database
    ) {

        return null;

    }


    const match =
        cleanPlate.match(
            /^(\d{2,3})([A-Z]{1,2})/
        );


    if (!match) {
        return null;
    }


    const countyCode =
        match[2];


    if (
        database[countyCode]
    ) {

        return database[
            countyCode
        ];

    }


    return null;

}


/* =========================================================
   SZUKANIE KODU NA POCZĄTKU
   ========================================================= */

function findCodeInDatabase(
    cleanPlate,
    database
) {

    if (!database) {
        return null;
    }


    const codes =
        Object.keys(database)
            .sort(
                function (a, b) {

                    return (
                        b.length -
                        a.length
                    );

                }
            );


    for (
        const code of codes
    ) {

        const cleanCode =
            code
                .toUpperCase()
                .replace(
                    /[\s-]/g,
                    ""
                );


        if (
            cleanPlate.startsWith(
                cleanCode
            )
        ) {

            return database[
                code
            ];

        }

    }


    return null;

}


/* =========================================================
   ODLEGŁOŚĆ DROGOWA — OSRM
   ========================================================= */

async function calculateStickerDistance(
    country,
    originCity,
    foundLocation
) {

    if (
        !country ||
        !originCity ||
        !foundLocation
    ) {

        return null;

    }


    const countryNames = {

        "PL": "Poland",
        "DE": "Germany",
        "RO": "Romania",
        "UA": "Ukraine",
        "CZ": "Czech Republic",
        "DK": "Denmark",
        "SE": "Sweden",
        "NL": "Netherlands",
        "FR": "France",
        "PT": "Portugal",
        "IT": "Italy",
        "ES": "Spain",
        "NO": "Norway",
        "FI": "Finland",
        "BE": "Belgium",
        "AT": "Austria",
        "CH": "Switzerland",
        "HU": "Hungary",
        "SK": "Slovakia",
        "SI": "Slovenia",
        "HR": "Croatia",
        "XK": "Kosovo",
        "BG": "Bulgaria",
        "GR": "Greece",
        "AL": "Albania",
        "EE": "Estonia",
        "LV": "Latvia",
        "LT": "Lithuania",
        "IS": "Iceland",
        "IE": "Ireland",
        "GB": "United Kingdom",
        "BY": "Belarus"

    };


    const countryName =
        countryNames[country] ||
        "";


    async function geocode(
        query
    ) {

        const url =
            "https://nominatim.openstreetmap.org/search" +
            "?format=json" +
            "&limit=1" +
            "&q=" +
            encodeURIComponent(query);


        const response =
            await fetch(
                url,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Geocoding HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            !data.length
        ) {

            return null;

        }


        return {

            lat:
                parseFloat(
                    data[0].lat
                ),

            lon:
                parseFloat(
                    data[0].lon
                )

        };

    }


    const foundCoordinates =
        await geocode(
            foundLocation
        );


    if (!foundCoordinates) {

        throw new Error(
            "Nie znaleziono miejsca: " +
            foundLocation
        );

    }


    let originQuery =
        originCity;


    if (countryName) {

        originQuery +=
            ", " +
            countryName;

    }


    const originCoordinates =
        await geocode(
            originQuery
        );


    if (!originCoordinates) {

        throw new Error(
            "Nie znaleziono miasta pochodzenia: " +
            originCity
        );

    }


    const osrmUrl =
        "https://router.project-osrm.org/route/v1/driving/" +
        originCoordinates.lon +
        "," +
        originCoordinates.lat +
        ";" +
        foundCoordinates.lon +
        "," +
        foundCoordinates.lat +
        "?overview=false";


    const osrmResponse =
        await fetch(
            osrmUrl
        );


    if (!osrmResponse.ok) {

        throw new Error(
            "OSRM HTTP " +
            osrmResponse.status
        );

    }


    const osrmData =
        await osrmResponse.json();


    if (
        !osrmData.routes ||
        !osrmData.routes.length
    ) {

        throw new Error(
            "OSRM nie znalazł trasy."
        );

    }


    const kilometers =
        Math.round(
            osrmData.routes[0].distance /
            1000
        );


    const stars =
        calculateStarsFromKilometers(
            kilometers
        );


    return {

        kilometers:
            kilometers,

        distanceText:
            kilometers +
            " km",

        stars:
            stars,

        starsText:
            "★".repeat(
                stars
            )

    };

}


/* =========================================================
   GWIAZDKI Z KM
   ========================================================= */

function calculateStarsFromKilometers(
    kilometers
) {

    let stars =
        1;


    if (
        kilometers >= 500
    ) {

        stars =
            2;

    }


    if (
        kilometers >= 1000
    ) {

        stars =
            3;

    }


    if (
        kilometers >= 1500
    ) {

        stars =
            4;

    }


    if (
        kilometers >= 2000
    ) {

        stars =
            5;

    }


    return stars;

}


/* =========================================================
   EDYCJA KARTY
   ========================================================= */

function editSticker(
    sticker
) {

    editingStickerId =
        sticker.id;


    const form =
        document.getElementById(
            "sticker-form"
        );


    const addButton =
        document.getElementById(
            "add-sticker-btn"
        );


    const saveButton =
        document.getElementById(
            "save-sticker-btn"
        );


    const countrySelect =
        document.getElementById(
            "sticker-country"
        );


    const plateInput =
        document.getElementById(
            "sticker-plate"
        );


    const locationInput =
        document.getElementById(
            "sticker-location"
        );


    const ownerSelect =
        document.getElementById(
            "sticker-owner"
        );


    if (countrySelect) {

        countrySelect.value =
            sticker.country;

    }


    createFrenchDepartmentSelect();


    const frenchDepartmentSelect =
        document.getElementById(
            "french-department"
        );


    if (
        frenchDepartmentSelect &&
        sticker.country === "FR"
    ) {

        frenchDepartmentSelect.value =
            sticker.department ||
            "";

    }


    if (plateInput) {

        plateInput.value =
            sticker.plate;

    }


    if (locationInput) {

        locationInput.value =
            sticker.location;

    }


    if (ownerSelect) {

        ownerSelect.value =
            sticker.owner;

    }


    if (form) {

        form.removeAttribute(
            "hidden"
        );

    }


    if (addButton) {

        addButton.textContent =
            "− ZAMKNIJ";

    }


    if (saveButton) {

        saveButton.textContent =
            "ZAPISZ ZMIANY";

    }


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


/* =========================================================
   ANULOWANIE TRYBU EDYCJI
   ========================================================= */

function resetEditMode() {

    editingStickerId =
        null;


    const saveButton =
        document.getElementById(
            "save-sticker-btn"
        );


    if (saveButton) {

        saveButton.textContent =
            "DODAJ TABLICĘ";

    }

}


/* =========================================================
   MIGRACJA LOCALSTORAGE → SUPABASE
   ========================================================= */

async function migrateOldStickers() {

    if (!currentUser) {
        return;
    }


    if (
        localStorage.getItem(
            MIGRATION_KEY
        ) === "done"
    ) {

        return;

    }


    /*
     * Jeżeli użytkownik już ma kolekcję
     * w Supabase, nie próbujemy importować
     * starego localStorage.
     */

    if (
        stickersCache.length > 0
    ) {

        localStorage.setItem(
            MIGRATION_KEY,
            "done"
        );

        return;

    }


    const oldData =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!oldData) {

        localStorage.setItem(
            MIGRATION_KEY,
            "done"
        );

        return;

    }


    let oldStickers;


    try {

        oldStickers =
            JSON.parse(
                oldData
            );

    }

    catch (error) {

        console.error(
            "Błąd odczytu starego localStorage:",
            error
        );

        localStorage.setItem(
            MIGRATION_KEY,
            "done"
        );

        return;

    }


    if (
        !Array.isArray(oldStickers) ||
        !oldStickers.length
    ) {

        localStorage.setItem(
            MIGRATION_KEY,
            "done"
        );

        return;

    }


    console.log(
        "Rozpoczynam migrację",
        oldStickers.length,
        "starych naklejek do konta..."
    );


    let migrated =
        0;


    for (
        const sticker of oldStickers
    ) {

        try {

            sticker.user_id =
                currentUser.id;


            await saveStickerToSupabaseOnly(
                sticker
            );

            migrated++;

        }

        catch (error) {

            console.error(
                "Nie udało się przenieść naklejki:",
                sticker,
                error
            );

        }

    }


    await loadStickersFromSupabase();


    localStorage.setItem(
        MIGRATION_KEY,
        "done"
    );


    console.log(
        "Migracja zakończona.",
        migrated,
        "naklejek przeniesiono."
    );


    if (
        migrated > 0
    ) {

        alert(
            "Twoja stara kolekcja została przeniesiona do Twojego konta.\n\n" +
            "Przeniesiono: " +
            migrated +
            " naklejek."
        );

    }

}


/* =========================================================
   MIGRACJA — ZAPIS BEZ CACHE
   ========================================================= */

async function saveStickerToSupabaseOnly(
    sticker
) {

    if (!currentUser) {

        throw new Error(
            "Brak zalogowanego użytkownika."
        );

    }


    sticker.user_id =
        currentUser.id;


    const url =
        SUPABASE_URL +
        "/" +
        SUPABASE_TABLE;


    const response =
        await fetch(
            url,
            {
                method:
                    "POST",

                headers:
                    supabaseHeaders(),

                body:
                    JSON.stringify(
                        {
                            id:
                                sticker.id,

                            user_id:
                                currentUser.id,

                            country:
                                sticker.country,

                            plate:
                                sticker.plate,

                            location:
                                sticker.location,

                            origin:
                                sticker.origin || "",

                            department:
                                sticker.department || "",

                            owner:
                                sticker.owner || "green",

                            date:
                                sticker.date ||
                                new Date().toISOString(),

                            kilometers:
                                typeof sticker.kilometers ===
                                    "number"
                                    ? sticker.kilometers
                                    : null,

                            stars:
                                typeof sticker.stars ===
                                    "number"
                                    ? sticker.stars
                                    : 0
                        }
                    )
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            "Supabase HTTP " +
            response.status +
            ": " +
            errorText
        );

    }

}


/* =========================================================
   RENDEROWANIE STRONY PAŃSTWA
   ========================================================= */

function renderCurrentCountry() {

    const stickerGrid =
        document.getElementById(
            "sticker-grid"
        );


    if (!stickerGrid) {
        return;
    }


    const currentCountry =
        getCurrentCountry();


    if (!currentCountry) {
        return;
    }


    let stickers =
        getStickers()
            .filter(
                function (sticker) {

                    return (
                        sticker.country ===
                        currentCountry
                    );

                }
            );


    stickers.sort(
        function (a, b) {

            return a.plate.localeCompare(
                b.plate,
                "pl",
                {
                    numeric: true,
                    sensitivity: "base"
                }
            );

        }
    );


    stickerGrid.innerHTML =
        "";


    if (
        stickers.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "album-empty";


        empty.textContent =
            "TEN ALBUM JEST OBECNIE PUSTY";


        stickerGrid.appendChild(
            empty
        );


        return;

    }


    stickers.forEach(
        function (sticker) {

            const article =
                createStickerCard(
                    sticker
                );


            stickerGrid.appendChild(
                article
            );

        }
    );

}


/* =========================================================
   TWORZENIE KARTY
   ========================================================= */

function createStickerCard(
    sticker
) {

    const article =
        document.createElement(
            "article"
        );


    let stickerClass =
        getStickerColorClass(
            sticker
        );


    if (
        sticker.owner ===
        "special"
    ) {

        stickerClass =
            "sticker-gold";

    }


    article.className =
        "sticker " +
        stickerClass;


    const plate =
        document.createElement(
            "div"
        );


    plate.className =
        "plate plate-" +
        sticker.country.toLowerCase();


    const country =
        document.createElement(
            "div"
        );


    country.className =
        "plate-country";


    country.textContent =
        sticker.country;


    const number =
        document.createElement(
            "div"
        );


    number.className =
        "plate-number";


    number.textContent =
        sticker.plate;


    plate.appendChild(
        country
    );


    plate.appendChild(
        number
    );


    if (
        sticker.country === "FR" &&
        sticker.department
    ) {

        const department =
            document.createElement(
                "div"
            );


        department.className =
            "plate-department";


        department.textContent =
            sticker.department;


        plate.appendChild(
            department
        );

    }


    const origin =
        document.createElement(
            "div"
        );


    origin.className =
        "plate-origin";


    let originText =
        sticker.origin;


    if (!originText) {

        originText =
            findCity(
                sticker.country,
                sticker.plate,
                sticker.department || ""
            ) || "";

    }


    origin.textContent =
        originText;


    const found =
        document.createElement(
            "div"
        );


    found.className =
        "sticker-location";


    found.textContent =
        "ZNALEZIONA: " +
        sticker.location;


    const distance =
        document.createElement(
            "div"
        );


    distance.className =
        "sticker-distance";


    if (
        typeof sticker.kilometers ===
            "number" &&

        Number.isFinite(
            sticker.kilometers
        )
    ) {

        distance.textContent =
            "ODLEGŁOŚĆ: " +
            sticker.kilometers +
            " KM";

    }

    else {

        distance.textContent =
            "ODLEGŁOŚĆ: —";

    }


    const stars =
        document.createElement(
            "div"
        );


    stars.className =
        "sticker-stars";


    if (
        typeof sticker.stars ===
            "number" &&

        sticker.stars > 0
    ) {

        stars.textContent =
            "★".repeat(
                sticker.stars
            );

    }

    else {

        stars.textContent =
            "—";

    }


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "sticker-actions";


    const editButton =
        document.createElement(
            "button"
        );


    editButton.type =
        "button";


    editButton.className =
        "sticker-edit";


    editButton.textContent =
        "EDYTUJ";


    editButton.addEventListener(
        "click",
        function () {

            editSticker(
                sticker
            );

        }
    );


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";


    deleteButton.className =
        "sticker-delete";


    deleteButton.textContent =
        "USUŃ";


    deleteButton.addEventListener(
        "click",
        async function () {

            const confirmed =
                confirm(
                    "Usunąć tablicę " +
                    sticker.country +
                    " " +
                    sticker.plate +
                    " z kolekcji?"
                );


            if (!confirmed) {
                return;
            }


            deleteButton.disabled =
                true;


            try {

                await deleteSticker(
                    sticker
                );

                renderCurrentCountry();

                updateCountryCounters();

                updateCountryCardStates();

            }

            catch (error) {

                console.error(
                    "Błąd usuwania:",
                    error
                );

                alert(
                    "Nie udało się usunąć naklejki z bazy.\n\n" +
                    error.message
                );

                deleteButton.disabled =
                    false;

            }

        }
    );


    actions.appendChild(
        editButton
    );


    actions.appendChild(
        deleteButton
    );


    article.appendChild(
        plate
    );


    article.appendChild(
        origin
    );


    article.appendChild(
        found
    );


    article.appendChild(
        distance
    );


    article.appendChild(
        stars
    );


    article.appendChild(
        actions
    );


    return article;

}


/* =========================================================
   KOLOR KARTY
   ========================================================= */

function getStickerColorClass(
    sticker
) {

    const stars =
        Number(
            sticker.stars
        );


    if (
        stars <= 1
    ) {

        return "sticker-brown";

    }


    if (
        stars === 2
    ) {

        return "sticker-blue";

    }


    if (
        stars === 3
    ) {

        return "sticker-green";

    }


    if (
        stars === 4
    ) {

        return "sticker-red";

    }


    return "sticker-black";

}


/* =========================================================
   AKTUALNY KRAJ
   ========================================================= */

function getCurrentCountry() {

    const file =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    const countries = {

        "al.html": "AL",
        "at.html": "AT",
        "be.html": "BE",
        "by.html": "BY",
        "bg.html": "BG",
        "hr.html": "HR",
        "cz.html": "CZ",
        "dk.html": "DK",
        "ee.html": "EE",
        "fi.html": "FI",
        "fr.html": "FR",
        "gr.html": "GR",
        "es.html": "ES",
        "nl.html": "NL",
        "ie.html": "IE",
        "is.html": "IS",
        "xk.html": "XK",
        "lt.html": "LT",
        "lv.html": "LV",
        "de.html": "DE",
        "no.html": "NO",
        "pl.html": "PL",
        "pt.html": "PT",
        "ro.html": "RO",
        "sk.html": "SK",
        "si.html": "SI",
        "ch.html": "CH",
        "se.html": "SE",
        "ua.html": "UA",
        "hu.html": "HU",
        "gb.html": "GB",
        "it.html": "IT"

    };


    return (
        countries[file] ||
        null
    );

}


/* =========================================================
   LICZNIKI PAŃSTW
   ========================================================= */

function updateCountryCounters() {

    const stickers =
        getStickers();


    const countryCards =
        document.querySelectorAll(
            ".country-card"
        );


    countryCards.forEach(
        function (card) {

            const href =
                card.getAttribute(
                    "href"
                );


            if (!href) {
                return;
            }


            const match =
                href.match(
                    /(?:^|\/)countries\/([a-z]{2})\.html(?:[?#].*)?$/i
                );


            if (!match) {
                return;
            }


            const country =
                match[1].toUpperCase();


            const count =
                stickers.filter(
                    function (sticker) {

                        return (
                            sticker.country ===
                            country
                        );

                    }
                ).length;


            const countElement =
                card.querySelector(
                    ".country-card-count"
                );


            if (!countElement) {
                return;
            }


            if (
                count === 1
            ) {

                countElement.textContent =
                    "1 naklejka";

            }

            else {

                countElement.textContent =
                    count +
                    " naklejek";

            }

        }
    );

}


/* =========================================================
   KOLOR KART PAŃSTW
   ========================================================= */

function updateCountryCardStates() {

    const stickers =
        getStickers();


    const countryCards =
        document.querySelectorAll(
            ".country-card"
        );


    countryCards.forEach(
        function (card) {

            const href =
                card.getAttribute(
                    "href"
                );


            if (!href) {
                return;
            }


            const match =
                href.match(
                    /(?:^|\/)countries\/([a-z]{2})\.html(?:[?#].*)?$/i
                );


            if (!match) {
                return;
            }


            const country =
                match[1].toUpperCase();


            const count =
                stickers.filter(
                    function (sticker) {

                        return (
                            sticker.country ===
                            country
                        );

                    }
                ).length;


            const countElement =
                card.querySelector(
                    ".country-card-count"
                );


            if (
                countElement
            ) {

                if (
                    count === 1
                ) {

                    countElement.textContent =
                        "1 naklejka";

                }

                else {

                    countElement.textContent =
                        count +
                        " naklejek";

                }

            }


            card.classList.remove(
                "country-empty"
            );


            card.classList.remove(
                "country-active"
            );


            if (
                count === 0
            ) {

                card.classList.add(
                    "country-empty"
                );

            }

            else {

                card.classList.add(
                    "country-active"
                );

            }

        }
    );

}


/* =========================================================
   DUPLIKAT
   ========================================================= */

function findDuplicateSticker(
    country,
    plate,
    ignoreId
) {

    const stickers =
        getStickers();


    const cleanPlate =
        plate
            .toUpperCase()
            .replace(
                /[\s-]/g,
                ""
            );


    return stickers.find(
        function (sticker) {

            if (
                ignoreId &&
                String(sticker.id) ===
                String(ignoreId)
            ) {

                return false;

            }


            if (
                sticker.country !==
                country
            ) {

                return false;

            }


            const existingPlate =
                String(
                    sticker.plate ||
                    ""
                )
                    .toUpperCase()
                    .replace(
                        /[\s-]/g,
                        ""
                    );


            return (
                existingPlate ===
                cleanPlate
            );

        }
    ) || null;

}


/* =========================================================
   POBIERANIE NAKLEJEK
   ========================================================= */

function getStickers() {

    return stickersCache;

}


/* =========================================================
   USUWANIE NAKLEJKI
   ========================================================= */

async function deleteSticker(
    stickerToDelete
) {

    await deleteStickerFromSupabase(
        stickerToDelete
    );


    stickersCache =
        stickersCache.filter(
            function (sticker) {

                return (
                    String(sticker.id) !==
                    String(stickerToDelete.id)
                );

            }
        );

}


/* =========================================================
   GENEROWANIE ID
   ========================================================= */

function generateStickerId() {

    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );

}


/* =========================================================
   GOTOWE
   ========================================================= */
