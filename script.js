/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   script.js
   WERSJA 8.0 — SUPABASE

   - SUPABASE JAKO GŁÓWNA BAZA DANYCH
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
    "8";

const MIGRATION_KEY =
    "albumMigrationV8";


/* =========================================================
   CACHE NAKLEJEK
   ========================================================= */

let stickersCache = [];

let stickersLoaded = false;

let currentCountryPage = 1;

// Mobilna pozycja na pierwszej rozkładówce.
let currentFrontmatterPage = "form";

// Wspólne rozpoznawanie telefonu także po obróceniu poziomo.
function isMobileAlbumLayout() {
    return window.matchMedia(
        "(max-width: 750px), (pointer: coarse) and (max-height: 750px)"
    ).matches;
}

function setFrontmatterMobilePage(pageName) {

    const frontmatter =
        document.getElementById("album-frontmatter");

    if (!frontmatter) return;

    const isMobile =
        isMobileAlbumLayout();

    const leftPage =
        frontmatter.querySelector('[data-page-side="left"]');

    const rightPage =
        frontmatter.querySelector('[data-page-side="right"]');

    const previousButton =
        document.querySelector(
            ".album-frontmatter-navigation .album-page-nav:first-child"
        );

    const nextButton =
        document.getElementById("album-frontmatter-next");

    currentFrontmatterPage = pageName;

    // Komputer: nadal dwie strony obok siebie.
    if (!isMobile) {

        if (leftPage) leftPage.hidden = false;
        if (rightPage) rightPage.hidden = false;

        if (previousButton) previousButton.disabled = true;

        if (nextButton) {
            nextButton.textContent = "NASTĘPNA →";
        }

        return;
    }

    // Telefon: tylko jedna strona.
    if (leftPage) {
        leftPage.hidden = pageName !== "form";
    }

    if (rightPage) {
        rightPage.hidden = pageName !== "toc";
    }

    if (previousButton) {
        previousButton.disabled = pageName === "form";
    }

    if (nextButton) {
        nextButton.textContent =
            pageName === "form"
                ? "NASTĘPNA →"
                : "OTWÓRZ ALBUM →";
    }
}

/* =========================================================
   AKTUALNIE EDYTOWANA KARTA
   ========================================================= */

let editingStickerId =
    null;


/* =========================================================
   STAŁA RZADKOŚĆ KRAJÓW
   ========================================================= */

const FIXED_COUNTRY_STARS = {

    // 1 GWIAZDKA
    "SE": 1,
    "DK": 1,

    // 2 GWIAZDKI
    "BE": 2,
    "NL": 2,
    "LV": 2,
    "LT": 2,

    // 3 GWIAZDKI
    "FI": 3,
    "ES": 3,
    "EE": 3,
    "LU": 3,
    "HU": 3,
    "IT": 3,

    // 4 GWIAZDKI
    "PT": 4,
    "GR": 4,
    "BA": 4,
    "MT": 4,
    "ME": 4,

    // 5 GWIAZDEK
    "AL": 5,
    "IS": 5,
    "AD": 5,
    "AM": 5,
    "CY": 5,
    "GE": 5,
    "LI": 5,
    "MC": 5,
    "SM": 5

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

        // Nawigacja działa niezależnie od połączenia z Supabase.
        initializeAlbumNavigation();


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

            return;

        }


        /* =================================================
           MIGRACJA STAREGO LOCALSTORAGE
           ================================================= */

        await migrateOldStickers();


        /* =================================================
           ODŚWIEŻENIE ALBUMU PO WCZYTANIU BAZY
           ================================================= */

        updateCountryCounters();

        updateCountryCardStates();

        renderCurrentCountry();


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
                        country === "UZ"
                            ? "special"
                            : ownerSelect
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


                        /* -----------------------------------------
                           KOMUNIKAT
                           ----------------------------------------- */

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


                        /* -----------------------------------------
                           KOMUNIKAT
                           ----------------------------------------- */

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

    }
);


/* =========================================================
   SUPABASE — NAGŁÓWKI
   ========================================================= */

function supabaseHeaders(
    extraHeaders = {}
) {

    return {

        "apikey":
            SUPABASE_KEY,

        "Content-Type":
            "application/json",

        ...extraHeaders

    };

}


/* =========================================================
   SUPABASE — POBIERANIE WSZYSTKICH NAKLEJEK
   ========================================================= */

async function loadStickersFromSupabase() {

    const url =
        SUPABASE_URL +
        "/" +
        SUPABASE_TABLE +
        "?select=*";


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
        "naklejek."
    );

}


/* =========================================================
   SUPABASE — DODAWANIE
   ========================================================= */

async function saveSticker(
    sticker
) {

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

    const url =
        SUPABASE_URL +
        "/" +
        SUPABASE_TABLE +
        "?id=eq." +
        encodeURIComponent(
            sticker.id
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

    const url =
        SUPABASE_URL +
        "/" +
        SUPABASE_TABLE +
        "?id=eq." +
        encodeURIComponent(
            sticker.id
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

    if (country === "UZ") {
        return findUzbekistanCity(cleanPlate);
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
                : null,

        "TR":
            typeof TURCJA_KODY !== "undefined"
                ? TURCJA_KODY
                : null,

    };


    const database =
        databases[country];


    if (!database) {
        return null;
    }


       /* =====================================================
       CZECHY — KOD REGIONU
       ===================================================== */

    if (country === "CZ") {

        if (/^\d[A-Z]/.test(cleanPlate)) {

            const regionCode =
                cleanPlate.charAt(1);

            return database[regionCode] || null;

        }

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
        "BY": "Belarus",
        "TR": "Turkey",
        "UZ": "Uzbekistan"

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


    if (form) {
        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    if (plateInput) {
        window.setTimeout(function () {
            plateInput.focus({ preventScroll: true });
        }, 250);
    }

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

    if (
        localStorage.getItem(
            MIGRATION_KEY
        ) === "done"
    ) {

        return;

    }


    /*
       WAŻNE:

       Migrację wykonujemy tylko wtedy,
       kiedy Supabase jest puste.

       Dzięki temu wejście na telefonie,
       który nie ma starego localStorage,
       NIE nadpisze ani nie zmieni kolekcji.
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
        "starych naklejek do Supabase..."
    );


    let migrated =
        0;


    for (
        const sticker of oldStickers
    ) {

        try {

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


    /*
       Po migracji ponownie pobieramy bazę,
       żeby cache był dokładnie taki sam
       jak dane w Supabase.
    */

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
            "Kolekcja została przeniesiona do wspólnej bazy.\n\n" +
            "Przeniesiono: " +
            migrated +
            " naklejek.\n\n" +
            "Od teraz komputer i telefon będą korzystać z tej samej kolekcji."
        );

    }

}


/* =========================================================
   MIGRACJA — ZAPIS BEZ CACHE
   ========================================================= */

async function saveStickerToSupabaseOnly(
    sticker
) {

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
    const legacyGrid = document.getElementById("sticker-grid");
    const leftGrid = document.getElementById("left-sticker-grid");
    const rightGrid = document.getElementById("right-sticker-grid");

    if (!legacyGrid || !leftGrid || !rightGrid) return;

    const albumView = document.body.dataset.albumView;
    const currentCountry = getCurrentCountry();
    const albumShell = document.querySelector(".album");

    const leftPage = document.querySelector(".album-page-left");
    const rightPage = document.querySelector(".album-page-right");

    const isMobileAlbum = isMobileAlbumLayout();
    const pocketsPerPage = isMobileAlbum ? 30 : 60;

    const isSpecialView =
        albumView === "special" || albumView === "guest";

    const viewKey = isSpecialView
        ? albumView
        : "country:" + (currentCountry || "");

    const countryData = {
        AL: ["ALBANIA", "🇦🇱"],
        AD: ["ANDORA", "🇦🇩"],
        AM: ["ARMENIA", "🇦🇲"],
        AT: ["AUSTRIA", "🇦🇹"],
        AZ: ["AZERBEJDŻAN", "🇦🇿"],
        BE: ["BELGIA", "🇧🇪"],
        BY: ["BIAŁORUŚ", "🇧🇾"],
        BA: ["BOŚNIA I HERCEGOWINA", "🇧🇦"],
        BG: ["BUŁGARIA", "🇧🇬"],
        HR: ["CHORWACJA", "🇭🇷"],
        ME: ["CZARNOGÓRA", "🇲🇪"],
        CY: ["CYPR", "🇨🇾"],
        CZ: ["CZECHY", "🇨🇿"],
        DK: ["DANIA", "🇩🇰"],
        EE: ["ESTONIA", "🇪🇪"],
        FI: ["FINLANDIA", "🇫🇮"],
        FR: ["FRANCJA", "🇫🇷"],
        GR: ["GRECJA", "🇬🇷"],
        GE: ["GRUZJA", "🇬🇪"],
        ES: ["HISZPANIA", "🇪🇸"],
        NL: ["HOLANDIA", "🇳🇱"],
        IE: ["IRLANDIA", "🇮🇪"],
        IS: ["ISLANDIA", "🇮🇸"],
        KZ: ["KAZACHSTAN", "🇰🇿"],
        XK: ["KOSOWO", "🇽🇰"],
        LI: ["LIECHTENSTEIN", "🇱🇮"],
        LT: ["LITWA", "🇱🇹"],
        LU: ["LUKSEMBURG", "🇱🇺"],
        LV: ["ŁOTWA", "🇱🇻"],
        MK: ["MACEDONIA PÓŁNOCNA", "🇲🇰"],
        MT: ["MALTA", "🇲🇹"],
        MD: ["MOŁDAWIA", "🇲🇩"],
        MC: ["MONAKO", "🇲🇨"],
        DE: ["NIEMCY", "🇩🇪"],
        NO: ["NORWEGIA", "🇳🇴"],
        PL: ["POLSKA", "🇵🇱"],
        PT: ["PORTUGALIA", "🇵🇹"],
        RU: ["ROSJA", "🇷🇺"],
        RO: ["RUMUNIA", "🇷🇴"],
        SM: ["SAN MARINO", "🇸🇲"],
        RS: ["SERBIA", "🇷🇸"],
        SK: ["SŁOWACJA", "🇸🇰"],
        SI: ["SŁOWENIA", "🇸🇮"],
        CH: ["SZWAJCARIA", "🇨🇭"],
        SE: ["SZWECJA", "🇸🇪"],
        TR: ["TURCJA", "🇹🇷"],
        UA: ["UKRAINA", "🇺🇦"],
        VA: ["WATYKAN", "🇻🇦"],
        HU: ["WĘGRY", "🇭🇺"],
        GB: ["WIELKA BRYTANIA", "🇬🇧"],
        IT: ["WŁOCHY", "🇮🇹"],
        GUEST: ["GUEST", "👥"],
        VIP: ["VIP", "⭐"]
    };

    const allStickers = getStickers();
    let albumSlots = [];
    const countryOffsets = new Map();

    /* =====================================================
       OSOBNE WIDOKI VIP / GUEST
       ===================================================== */

    if (isSpecialView) {
        const stickers = allStickers
            .filter(function (sticker) {
                return albumView === "special"
                    ? sticker.owner === "special"
                    : sticker.owner === "guest";
            })
            .sort(function (a, b) {
                return a.plate.localeCompare(
                    b.plate,
                    "pl",
                    { numeric: true, sensitivity: "base" }
                );
            });

        albumSlots = stickers.map(function (sticker) {
            return {
                sticker: sticker,
                country: sticker.owner === "special" ? "VIP" : "GUEST"
            };
        });

        if (renderCurrentCountry._activeViewKey !== viewKey) {
            currentCountryPage = 1;
        }

        renderCurrentCountry._activeViewKey = viewKey;
    }

    /* =====================================================
       GŁÓWNY ALBUM — 51 KRAJÓW + GUEST + VIP
       ===================================================== */

    else {
        const countryOrder = [
            "AL", "AD", "AM", "AT", "AZ",
            "BE", "BY", "BA", "BG",
            "HR", "ME", "CY", "CZ",
            "DK", "EE", "FI", "FR",
            "GR", "GE", "ES", "NL",
            "IE", "IS", "KZ", "XK",
            "LI", "LT", "LU", "LV",
            "MK", "MT", "MD", "MC",
            "DE", "NO", "PL", "PT",
            "RU", "RO", "SM", "RS",
            "SK", "SI", "CH", "SE",
            "TR", "UA", "VA", "HU",
            "GB", "IT"
        ];

        const stickersByCountry = new Map();

        allStickers.forEach(function (sticker) {
            if (!sticker.country) return;

            // GUEST i VIP są dodawane osobno na końcu albumu.
            if (
                sticker.owner === "guest" ||
                sticker.owner === "special"
            ) {
                return;
            }

            // Nieznane kraje nie dostają własnych stron.
            if (!countryOrder.includes(sticker.country)) {
                return;
            }

            if (!stickersByCountry.has(sticker.country)) {
                stickersByCountry.set(sticker.country, []);
            }

            stickersByCountry.get(sticker.country).push(sticker);
        });

        /* KRAJE — W USTALONEJ KOLEJNOŚCI */

        countryOrder.forEach(function (countryCode) {
            const countryStickers = (
                stickersByCountry.get(countryCode) || []
            ).slice().sort(function (a, b) {
                return a.plate.localeCompare(
                    b.plate,
                    "pl",
                    { numeric: true, sensitivity: "base" }
                );
            });

            countryOffsets.set(countryCode, albumSlots.length);

            const countryCapacity = Math.max(
                30,
                Math.ceil(countryStickers.length / 30) * 30
            );

            for (let i = 0; i < countryCapacity; i++) {
                albumSlots.push({
                    sticker: countryStickers[i] || null,
                    country: countryCode
                });
            }
        });

        /* KOLEKCJE SPECJALNE — GUEST, A NASTĘPNIE VIP */

        const specialCollections = [
            {
                code: "GUEST",
                owner: "guest"
            },
            {
                code: "VIP",
                owner: "special"
            }
        ];

        specialCollections.forEach(function (collection) {
            const specialStickers = allStickers
                .filter(function (sticker) {
                    return sticker.owner === collection.owner;
                })
                .slice()
                .sort(function (a, b) {
                    return a.plate.localeCompare(
                        b.plate,
                        "pl",
                        { numeric: true, sensitivity: "base" }
                    );
                });

            const specialCapacity = Math.max(
                30,
                Math.ceil(specialStickers.length / 30) * 30
            );

            countryOffsets.set(
                collection.code,
                albumSlots.length
            );

            for (let i = 0; i < specialCapacity; i++) {
                albumSlots.push({
                    sticker: specialStickers[i] || null,
                    country: collection.code
                });
            }
        });

        if (renderCurrentCountry._activeViewKey !== viewKey) {
            const countryStart =
                countryOffsets.get(currentCountry) || 0;

            currentCountryPage =
                Math.floor(countryStart / pocketsPerPage) + 1;
        }

        renderCurrentCountry._activeViewKey = viewKey;
    }

    /* =====================================================
       DYNAMICZNE NUMERY STRON W SPISIE TREŚCI
       ===================================================== */

    if (!isSpecialView) {
        updateAlbumToc(countryOffsets, pocketsPerPage);
    }

    /* =====================================================
       LICZBA STRON I AKTUALNA POZYCJA
       ===================================================== */

    const totalPages = Math.max(
        1,
        Math.ceil(albumSlots.length / pocketsPerPage)
    );

    currentCountryPage = Math.max(
        1,
        Math.min(currentCountryPage, totalPages)
    );

    const startIndex =
        (currentCountryPage - 1) * pocketsPerPage;

    /* =====================================================
       METADANE STRONY
       ===================================================== */

    function updatePageMetadata(side, countryCode, pageStart) {
        const isLeft = side === "left";
        const page = isLeft ? leftPage : rightPage;

        const flag = document.getElementById(
            isLeft ? "left-country-flag" : "right-country-flag"
        );

        const title = document.getElementById(
            isLeft ? "left-country-title" : "right-country-title"
        );

        const code = document.getElementById(
            isLeft ? "left-country-code" : "right-country-code"
        );

        const footerCountry = document.getElementById(
            isLeft ? "left-page-country" : "right-page-country"
        );

        const footerNumber = document.getElementById(
            isLeft ? "left-page-number" : "right-page-number"
        );

        const data = countryData[countryCode] || [
            countryCode || "EUROPA",
            "🌍"
        ];

        const name = data[0];
        const emoji = data[1];
        const displayCode = countryCode || "EU";

        page.dataset.country =
            countryCode === "GUEST" || countryCode === "VIP"
                ? countryCode
                : (countryCode || "SPECIAL");

        /* KOLOR KARTKI — STAŁY DLA CAŁEGO KRAJU */

        /* Paleta ułożona tak, aby sąsiadujące kraje
           miały możliwie różne kolory */

        const countryColors = [
            "#55A9E8", // jasny niebieski
            "#65B96A", // zielony
            "#3567C8", // głęboki niebieski
            "#E875A4", // różowy
            "#36BDB3", // turkusowy
            "#95613F", // brązowy
            "#E76B59", // czerwony
            "#9299A3"  // szary
        ];

        let pageColor;

        if (countryCode === "GUEST") {
            pageColor = "#9870D8";
        } else if (countryCode === "VIP") {
            pageColor = "#D5AE38";
        } else {
            const countryIndex =
                Array.from(countryOffsets.keys()).indexOf(countryCode);

            pageColor =
                countryColors[countryIndex % countryColors.length];
        }

        page.style.setProperty("--page-color", pageColor);

        /* Nagłówek — ten sam kolor, ale o 20% ciemniejszy */

        page.style.setProperty(
            "--page-header-color",
            `color-mix(in srgb, ${pageColor} 80%, black 20%)`
        );

        flag.textContent = emoji;
        title.textContent = name;
        code.textContent = displayCode;
        footerCountry.textContent = name;

        const physicalPageNumber =
            Math.floor(pageStart / 30) + 3;

        footerNumber.textContent =
            String(physicalPageNumber).padStart(3, "0");

        page.hidden = false;
    }

    /* =====================================================
       CZYSZCZENIE SIATEK
       ===================================================== */

    leftGrid.innerHTML = "";
    rightGrid.innerHTML = "";
    legacyGrid.innerHTML = "";

    leftPage.hidden = false;
    rightPage.hidden = isMobileAlbum;

    /* =====================================================
       TWORZENIE KIESZONEK
       ===================================================== */

    function createPocket(globalIndex) {
        const slot = albumSlots[globalIndex] || null;
        const sticker = slot ? slot.sticker : null;

        const pocketNumber = globalIndex + 1;

        const pocket = document.createElement("div");
        pocket.className = "album-pocket";

        if (sticker) {
            pocket.classList.add("album-pocket-filled");

            const article = createStickerCard(
                sticker,
                pocketNumber
            );

            pocket.appendChild(article);
            pocket.appendChild(createStickerActions(sticker));
        } else {
            pocket.classList.add("album-pocket-empty");

            const number = document.createElement("span");
            number.className = "album-pocket-number";
            number.textContent =
                String(pocketNumber).padStart(3, "0");

            const label = document.createElement("span");
            label.className = "album-pocket-label";
            label.textContent = "MIEJSCE NA KARTĘ";

            pocket.appendChild(number);
            pocket.appendChild(label);
        }

        return pocket;
    }

    /* =====================================================
       LEWA STRONA — 30 POZYCJI
       ===================================================== */

    const leftCountrySlot = albumSlots[startIndex];

    updatePageMetadata(
        "left",
        leftCountrySlot ? leftCountrySlot.country : currentCountry,
        startIndex
    );

    for (let i = 0; i < 30; i++) {
        leftGrid.appendChild(
            createPocket(startIndex + i)
        );
    }

    /* =====================================================
       PRAWA STRONA — 30 POZYCJI
       ===================================================== */

    if (!isMobileAlbum) {
        const rightStart = startIndex + 30;
        const rightCountrySlot = albumSlots[rightStart];

        if (rightCountrySlot) {
            updatePageMetadata(
                "right",
                rightCountrySlot.country,
                rightStart
            );

            for (let i = 0; i < 30; i++) {
                rightGrid.appendChild(
                    createPocket(rightStart + i)
                );
            }

            rightPage.hidden = false;
        } else {
            rightPage.hidden = true;
        }
    }

    /* =====================================================
       PUSTA KOLEKCJA W WIDOKU SPECJALNYM
       ===================================================== */

    if (isSpecialView && albumSlots.length === 0) {
        leftGrid.innerHTML = "";

        const empty = document.createElement("div");
        empty.className = "album-empty";
        empty.textContent = "TEN ALBUM JEST OBECNIE PUSTY";

        leftGrid.appendChild(empty);
    }

    /* =====================================================
       KOLOR ALBUMU — AKTUALNA LEWA STRONA
       ===================================================== */

    if (albumShell) {
        albumShell.dataset.country =
            leftCountrySlot && leftCountrySlot.country
                ? leftCountrySlot.country
                : (currentCountry || "AL");
    }

    /* =====================================================
       NAWIGACJA
       ===================================================== */

    const oldPagination =
        document.getElementById("album-pagination");

    if (oldPagination) oldPagination.remove();

    const pagination = document.createElement("div");
    pagination.id = "album-pagination";
    pagination.className = "album-pagination";

    const previousButton = document.createElement("button");
    previousButton.textContent = "← POPRZEDNIA";
    previousButton.disabled = false;

    previousButton.addEventListener("click", function () {

        if (currentCountryPage === 1) {
            showAlbumFrontmatter();
            return;
        }

        currentCountryPage--;
        renderCurrentCountry();

    });


    const nextButton = document.createElement("button");
    nextButton.textContent = "NASTĘPNA →";
    nextButton.disabled = currentCountryPage === totalPages;

    nextButton.addEventListener("click", function () {
        currentCountryPage++;
        renderCurrentCountry();
    });

    const tocButton = document.createElement("button");
    tocButton.id = "album-toc-return";
    tocButton.textContent = "☷ SPIS TREŚCI";

    tocButton.addEventListener("click", function () {
        showAlbumFrontmatter();
    });

    pagination.appendChild(previousButton);
    pagination.appendChild(nextButton);
    pagination.appendChild(tocButton);

    const spread = document.getElementById("album-spread");

    if (spread && spread.parentNode) {

        pagination.hidden = spread.hidden;

        spread.parentNode.insertBefore(pagination, spread);

} else {

    console.error(
        "Nie znaleziono kontenera album-spread."
    );

}

} // KONIEC renderCurrentCountry()

/* =========================================================
   TWORZENIE KARTY
   ========================================================= */

function createStickerCard(sticker, cardNumber) {

    const article = document.createElement("article");

    let stickerClass = getStickerColorClass(sticker);

    if (sticker.owner === "special") {
        stickerClass = "sticker-gold";
    } else if (sticker.owner === "guest") {
        stickerClass = "sticker-purple";
    }

    article.className = "sticker " + stickerClass;

    /* GÓRNY NAGŁÓWEK */

    const header = document.createElement("div");
    header.className = "sticker-header";

    const collectionName = document.createElement("div");
    collectionName.className = "sticker-collection-name";
    collectionName.textContent = String(cardNumber).padStart(3, "0");

    const countryCode = document.createElement("div");
    countryCode.className = "sticker-country-code";
    countryCode.textContent = sticker.country;

    header.appendChild(collectionName);
    header.appendChild(countryCode);

    /* OZNACZENIE EDYCJI */

    const edition = document.createElement("div");
    edition.className = "sticker-edition";

    if (sticker.owner === "special") {
        edition.textContent = "VIP EDITION";
    } else if (sticker.owner === "guest") {
        edition.textContent = "GUEST EDITION";
    } else {
        edition.textContent = "COLLECTOR EDITION";
    }

    /* TABLICA REJESTRACYJNA */

    const plate = document.createElement("div");

    plate.className =
        "plate plate-" +
        sticker.country.toLowerCase();

    const country = document.createElement("div");
    country.className = "plate-country";
    country.textContent = sticker.country;

    const number = document.createElement("div");
    number.className = "plate-number";
    number.textContent = sticker.plate;

    plate.appendChild(country);
    plate.appendChild(number);

    if (sticker.country === "FR" && sticker.department) {

        const department = document.createElement("div");
        department.className = "plate-department";
        department.textContent = sticker.department;

        plate.appendChild(department);
    }

    /* MIEJSCE POCHODZENIA */

    const originSection = document.createElement("div");
    originSection.className = "sticker-origin-section";

    const originLabel = document.createElement("div");
    originLabel.className = "sticker-section-label";
    originLabel.textContent = "MIEJSCE POCHODZENIA";

    const origin = document.createElement("div");
    origin.className = "plate-origin";

    let originText = sticker.origin;

    if (!originText) {
        originText =
            findCity(
                sticker.country,
                sticker.plate,
                sticker.department || ""
            ) || "";
    }

    origin.textContent = originText;

    originSection.appendChild(originLabel);
    originSection.appendChild(origin);

    /* INFORMACJE O ZNALEZIENIU */

    const meta = document.createElement("div");
    meta.className = "sticker-meta";

    const found = document.createElement("div");
    found.className = "sticker-location";

    const foundLabel = document.createElement("span");
    foundLabel.className = "sticker-meta-label";
    foundLabel.textContent = "ZNALEZIONA W";

    const foundValue = document.createElement("strong");
    foundValue.className = "sticker-meta-value";
    foundValue.textContent = sticker.location || "—";

    found.appendChild(foundLabel);
    found.appendChild(foundValue);

    /* ODLEGŁOŚĆ */

    const distance = document.createElement("div");
    distance.className = "sticker-distance";

    const distanceLabel = document.createElement("span");
    distanceLabel.className = "sticker-meta-label";
    distanceLabel.textContent = "ODLEGŁOŚĆ";

    const distanceValue = document.createElement("strong");
    distanceValue.className = "sticker-meta-value";

    if (
        typeof sticker.kilometers === "number" &&
        Number.isFinite(sticker.kilometers)
    ) {
        distanceValue.textContent = sticker.kilometers + " km";
    } else {
        distanceValue.textContent = "—";
    }

    distance.appendChild(distanceLabel);
    distance.appendChild(distanceValue);

    meta.appendChild(found);
    meta.appendChild(distance);

    /* RZADKOŚĆ KARTY */

    const stars = document.createElement("div");
    stars.className = "sticker-stars";

    if (sticker.owner === "special") {

        stars.textContent = "★★★★★";

    } else if (sticker.owner === "guest") {

        stars.textContent = "❤️❤️❤️❤️❤️";

    } else if (
        typeof sticker.stars === "number" &&
        sticker.stars > 0
    ) {

        stars.textContent = "★".repeat(sticker.stars);

    } else {

        stars.textContent = "—";
    }

    /* PRZEZROCZYSTA KOSZULKA */

    const sleeve = document.createElement("div");
    sleeve.className = "sticker-sleeve";

    /* SKŁADANIE KARTY */

    article.appendChild(header);
    article.appendChild(edition);
    article.appendChild(plate);
    article.appendChild(originSection);
    article.appendChild(meta);
    article.appendChild(stars);
    article.appendChild(sleeve);

    return article;
}


/* =========================================================
   PRZYCISKI KARTY — ODDZIELNA WARSTWA NAD KIESZONKĄ
   ========================================================= */

function createStickerActions(sticker) {

    const actions = document.createElement("div");
    actions.className = "sticker-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "sticker-edit";
    editButton.textContent = "✎";
    editButton.title = "Edytuj tablicę";
    editButton.setAttribute(
        "aria-label",
        "Edytuj tablicę " + sticker.country + " " + sticker.plate
    );

    editButton.addEventListener("click", function () {
        editSticker(sticker);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "sticker-delete";
    deleteButton.textContent = "×";
    deleteButton.title = "Usuń tablicę";
    deleteButton.setAttribute(
        "aria-label",
        "Usuń tablicę " + sticker.country + " " + sticker.plate
    );

    deleteButton.addEventListener("click", async function () {

        const confirmed = confirm(
            "Usunąć tablicę " +
            sticker.country +
            " " +
            sticker.plate +
            " z kolekcji?"
        );

        if (!confirmed) return;

        deleteButton.disabled = true;

        try {

            await deleteSticker(sticker);

            renderCurrentCountry();
            updateCountryCounters();
            updateCountryCardStates();

        } catch (error) {

            console.error("Błąd usuwania:", error);

            alert(
                "Nie udało się usunąć naklejki z bazy.\n\n" +
                error.message
            );

            deleteButton.disabled = false;
        }
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    return actions;
}

/* =========================================================
   KOLOR KARTY
   ========================================================= */

function getStickerColorClass(sticker) {

    const stars = Number(sticker.stars);

    if (stars <= 1) {
        return "sticker-brown";
    }

    if (stars === 2) {
        return "sticker-blue";
    }

    if (stars === 3) {
        return "sticker-green";
    }

    if (stars === 4) {
        return "sticker-red";
    }

    return "sticker-black";
}


/* =========================================================
   NAWIGACJA GŁÓWNEGO ALBUMU
   ========================================================= */

function initializeAlbumNavigation() {

    if (document.body.dataset.pageType !== "album") {
        return;
    }

    // OBSŁUGA KLIKNIĘĆ W SPISIE TREŚCI

    document.addEventListener("click", function (event) {

        const target = event.target;

        if (!target || typeof target.closest !== "function") {
            return;
        }

        const link = target.closest("[data-country-jump]");

        if (!link) {
            return;
        }

        event.preventDefault();

        const spreadIndex = Number(
            link.dataset.albumSpreadIndex
        );

        if (!Number.isFinite(spreadIndex)) {
            return;
        }

        const frontmatter =
            document.getElementById("album-frontmatter");

        const spread =
            document.getElementById("album-spread");

        const frontmatterNavigation =
            document.querySelector(".album-frontmatter-navigation");

        const pagination =
            document.getElementById("album-pagination");

        if (frontmatter) {
            frontmatter.hidden = true;
        }

        if (frontmatterNavigation) {
            frontmatterNavigation.hidden = true;
        }

        if (spread) {
            spread.hidden = false;
        }

        currentCountryPage = spreadIndex + 1;

        renderCurrentCountry();

        if (pagination) {
            pagination.hidden = false;
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });


    // PIERWSZA ROZKŁADÓWKA — NAWIGACJA MOBILNA

    setFrontmatterMobilePage("form");

    const frontmatterPreviousButton =
        document.querySelector(
            ".album-frontmatter-navigation .album-page-nav:first-child"
        );

    if (frontmatterPreviousButton) {

        frontmatterPreviousButton.addEventListener("click", function () {

            if (isMobileAlbumLayout()) {
                setFrontmatterMobilePage("form");

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }

        });

    }


    // FORMULARZ → SPIS TREŚCI → PIERWSZY KRAJ

    const frontmatterNextButton =
        document.getElementById("album-frontmatter-next");

    if (frontmatterNextButton) {

        frontmatterNextButton.addEventListener("click", function () {

            const isMobile =
                isMobileAlbumLayout();

            if (
                isMobile &&
                currentFrontmatterPage === "form"
            ) {

                setFrontmatterMobilePage("toc");

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                return;
            }

            const firstCountryLink =
                document.querySelector(
                    "#album-toc-countries [data-country-jump]"
                );

            if (firstCountryLink) {
                firstCountryLink.click();
            }

        });

    }

}


/* =========================================================
   POWRÓT DO SPISU TREŚCI
   ========================================================= */

function showAlbumFrontmatter() {

    // Na telefonie powrót prowadzi do spisu treści.
    setFrontmatterMobilePage("toc");

    const frontmatter =
        document.getElementById("album-frontmatter");

    const spread =
        document.getElementById("album-spread");

    const pagination =
        document.getElementById("album-pagination");

    const frontmatterNavigation =
        document.querySelector(".album-frontmatter-navigation");

    if (frontmatter) {
        frontmatter.hidden = false;
    }

    if (frontmatterNavigation) {
        frontmatterNavigation.hidden = false;
    }

    if (spread) {
        spread.hidden = true;
    }

    if (pagination) {
        pagination.hidden = true;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   AKTUALIZACJA NUMERÓW STRON SPISU TREŚCI
   ========================================================= */

function updateAlbumToc(countryOffsets, pocketsPerPage) {

    const links = document.querySelectorAll(
        "[data-country-jump]"
    );

    links.forEach(function (link) {

        const countryCode =
            link.dataset.countryJump;

        const offset =
            countryOffsets.get(countryCode);

        if (offset === undefined) {
            return;
        }

        const spreadIndex =
            Math.floor(offset / pocketsPerPage);

        link.dataset.albumSpreadIndex =
            spreadIndex;

        let pageNumber =
            link.querySelector(".album-toc-page");

        if (!pageNumber) {
            pageNumber = document.createElement("span");
            pageNumber.className = "album-toc-page";
            link.appendChild(pageNumber);
        }

        const physicalPage =
            Math.floor(offset / 30) + 3;

        pageNumber.textContent =
            String(physicalPage).padStart(3, "0");

    });

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
        "ad.html": "AD",
        "al.html": "AL",
        "am.html": "AM",
        "at.html": "AT",
        "az.html": "AZ",
        "ba.html": "BA",
        "be.html": "BE",
        "bg.html": "BG",
        "by.html": "BY",
        "ch.html": "CH",
        "cy.html": "CY",
        "cz.html": "CZ",
        "de.html": "DE",
        "dk.html": "DK",
        "ee.html": "EE",
        "es.html": "ES",
        "fi.html": "FI",
        "fr.html": "FR",
        "gb.html": "GB",
        "ge.html": "GE",
        "gr.html": "GR",
        "hr.html": "HR",
        "hu.html": "HU",
        "ie.html": "IE",
        "is.html": "IS",
        "it.html": "IT",
        "kz.html": "KZ",
        "li.html": "LI",
        "lt.html": "LT",
        "lu.html": "LU",
        "lv.html": "LV",
        "mc.html": "MC",
        "md.html": "MD",
        "me.html": "ME",
        "mk.html": "MK",
        "mt.html": "MT",
        "nl.html": "NL",
        "no.html": "NO",
        "pl.html": "PL",
        "pt.html": "PT",
        "ro.html": "RO",
        "rs.html": "RS",
        "ru.html": "RU",
        "se.html": "SE",
        "si.html": "SI",
        "sk.html": "SK",
        "sm.html": "SM",
        "tr.html": "TR",
        "ua.html": "UA",
        "va.html": "VA",
        "xk.html": "XK"
    };

    return countries[file] || null;

}


/* =========================================================
   LICZNIKI PAŃSTW
   ========================================================= */

function updateCountryCounters() {

    const stickers = getStickers();

    const countryCards =
        document.querySelectorAll(".country-card");

    countryCards.forEach(function (card) {

        const href = card.getAttribute("href");

        if (!href) {
            return;
        }

        const match = href.match(
            /countries\/([a-z]{2})\.html/i
        );

        if (!match) {
            return;
        }

        const country = match[1].toUpperCase();

        const count = stickers.filter(function (sticker) {
            return sticker.country === country;
        }).length;

        const countElement =
            card.querySelector(".country-card-count");

        if (!countElement) {
            return;
        }

        if (count === 1) {
            countElement.textContent = "1 naklejka";
        } else {
            countElement.textContent = count + " naklejek";
        }

    });

}


/* =========================================================
   KOLOR KART PAŃSTW
   ========================================================= */

function updateCountryCardStates() {

    const stickers = getStickers();

    const countryCards =
        document.querySelectorAll(".country-card");

    countryCards.forEach(function (card) {

        const href = card.getAttribute("href");

        if (!href) {
            return;
        }

        const match = href.match(
            /countries\/([a-z]{2})\.html/i
        );

        if (!match) {
            return;
        }

        const country = match[1].toUpperCase();

        const count = stickers.filter(function (sticker) {
            return sticker.country === country;
        }).length;

        card.classList.remove(
            "country-empty",
            "country-active"
        );

        if (count === 0) {
            card.classList.add("country-empty");
        } else {
            card.classList.add("country-active");
        }

    });

}


/* =========================================================
   DUPLIKAT
   ========================================================= */

function findDuplicateSticker(country, plate, ignoreId) {

    const stickers = getStickers();

    const cleanPlate = plate
        .toUpperCase()
        .replace(/[\s-]/g, "");

    return stickers.find(function (sticker) {

        if (
            ignoreId &&
            String(sticker.id) === String(ignoreId)
        ) {
            return false;
        }

        if (sticker.country !== country) {
            return false;
        }

        const existingPlate = String(
            sticker.plate || ""
        )
            .toUpperCase()
            .replace(/[\s-]/g, "");

        return existingPlate === cleanPlate;

    }) || null;

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

async function deleteSticker(stickerToDelete) {

    await deleteStickerFromSupabase(stickerToDelete);

    stickersCache = stickersCache.filter(function (sticker) {

        return (
            String(sticker.id) !==
            String(stickerToDelete.id)
        );

    });

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
