/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   script.js
   WERSJA 7.0

   - ODLEGŁOŚĆ DROGOWA OSRM
   - STAŁA RZADKOŚĆ DLA KRAJÓW
   - FRANCJA — WYBÓR DEPARTAMENTU
   - FRANCJA — PREFEKTURA JAKO PUNKT POCHODZENIA
   - FRANCJA — KOD DEPARTAMENTU Z PRAWEJ STRONY TABLICY
   - SŁOWACJA — ROZPOZNANE KODY / FALLBACK ★★
   - IRLANDIA — SPECJALNE ROZPOZNAWANIE KODU HRABSTWA
   - IRLANDIA — ODLEGŁOŚĆ DROGOWA ZAMIAST STAŁEJ RZADKOŚCI
   - AUTOMATYCZNA AKTUALIZACJA STARYCH KART
   - KOLOR KARTY WYNIKA Z GWIAZDEK
   - SPECIAL = ZŁOTA KARTA
   - EDYCJA KART
   - DUPLIKATY NIE SĄ DODAWANE
   ========================================================= */


/* =========================================================
   KONFIGURACJA
   ========================================================= */

const STORAGE_KEY =
    "albumStickers";

const STORAGE_VERSION_KEY =
    "albumStorageVersion";

const STORAGE_VERSION =
    "7";


/* =========================================================
   ID MIGRACJI
   ========================================================= */

const MIGRATION_KEY =
    "albumMigrationV7";


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
           MIGRACJA
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
                       FRANCJA — DEPARTAMENT
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
                       FRANCJA — WALIDACJA DEPARTAMENTU
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
                       EDYCJA ISTNIEJĄCEJ KARTY
                       ================================================= */

                    if (
                        editingStickerId
                    ) {

                        const stickers =
                            getStickers();


                        const index =
                            stickers.findIndex(
                                function (sticker) {

                                    return (
                                        sticker.id ===
                                        editingStickerId
                                    );

                                }
                            );


                        if (
                            index !== -1
                        ) {

                            const oldSticker =
                                stickers[index];


                            stickers[index] = {

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


                            localStorage.setItem(
                                STORAGE_KEY,
                                JSON.stringify(
                                    stickers
                                )
                            );

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
                       DODAWANIE NOWEJ KARTY
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


                        saveSticker(
                            sticker
                        );


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


    /* -----------------------------------------
       NIE FRANCJA
       ----------------------------------------- */

    if (
        countrySelect.value !== "FR"
    ) {

        if (existing) {

            existing.remove();

        }

        return;

    }


    /* -----------------------------------------
       JUŻ ISTNIEJE
       ----------------------------------------- */

    if (existing) {

        return;

    }


    /* -----------------------------------------
       WRAPPER
       ----------------------------------------- */

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.id =
        "french-department-wrapper";


    wrapper.className =
        "french-department-wrapper";


    /* -----------------------------------------
       LABEL
       ----------------------------------------- */

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


    /* -----------------------------------------
       SELECT
       ----------------------------------------- */

    const select =
        document.createElement(
            "select"
        );


    select.id =
        "french-department";


    select.name =
        "french-department";


    /* -----------------------------------------
       OPCJA DOMYŚLNA
       ----------------------------------------- */

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


    /* -----------------------------------------
       BAZA FRANCJI
       ----------------------------------------- */

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


    /* -----------------------------------------
       WRAPPER
       ----------------------------------------- */

    wrapper.appendChild(
        label
    );


    wrapper.appendChild(
        select
    );


    /* -----------------------------------------
       WSTAWIENIE DO FORMULARZA
       ----------------------------------------- */

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


    /* -----------------------------------------
       ZMIANA DEPARTAMENTU
       ----------------------------------------- */

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


    /* =====================================================
       BAZY KODÓW
       ===================================================== */

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

        /* -----------------------------------------------
           NOWY SYSTEM:
           DEPARTAMENT WYBRANY W FORMULARZU
           ----------------------------------------------- */

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


        /* -----------------------------------------------
           STARY SYSTEM:
           KOD NA KOŃCU NUMERU
           ----------------------------------------------- */

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
       =====================================================

       Irlandzkie tablice mają format np.:

       08-D-12345
       161-D-12345
       241-G-12345

       Po usunięciu spacji i myślników:

       08D12345
       161D12345
       241G12345

       Nie możemy użyć zwykłego findCodeInDatabase(),
       ponieważ wtedy kod szukany jest od pierwszego znaku
       i system może potraktować "08" albo "161" jako kod.

       Najpierw pomijamy 2 lub 3 cyfry roku,
       a dopiero potem szukamy kodu hrabstwa.
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


    /* =====================================================
       POZOSTAŁE KRAJE
       ===================================================== */

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


    /*
       Szukamy:

       2 lub 3 cyfry roku
       +
       1 lub 2 litery kodu hrabstwa

       Przykłady:

       08D12345
       08C12345
       161D12345
       241G12345
    */


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


    /* =====================================================
       GEOCODING
       ===================================================== */

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


    /* =====================================================
       MIEJSCE ZNALEZIENIA
       ===================================================== */

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


    /* =====================================================
       MIASTO POCHODZENIA
       ===================================================== */

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


    /* =====================================================
       OSRM
       ===================================================== */

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


    /* =====================================================
       KILOMETRY
       ===================================================== */

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


    /* -----------------------------------------
       FRANCJA
       ----------------------------------------- */

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
   MIGRACJA STARYCH KART
   ========================================================= */

async function migrateOldStickers() {

    if (
        localStorage.getItem(
            MIGRATION_KEY
        ) === "done"
    ) {

        return;

    }


    const stickers =
        getStickers();


    if (
        !stickers.length
    ) {

        localStorage.setItem(
            MIGRATION_KEY,
            "done"
        );

        return;

    }


    let changed =
        false;


    for (
        const sticker of stickers
    ) {

        /* =================================================
           SPECIAL
           ================================================= */

        if (
            sticker.owner ===
            "special"
        ) {

            sticker.stars =
                5;

            changed =
                true;

            continue;

        }


        /* =================================================
           STAŁA RZADKOŚĆ
           ================================================= */

        const fixedStars =
            getFixedCountryStars(
                sticker.country
            );


        if (
            fixedStars !== null
        ) {

            sticker.kilometers =
                null;

            sticker.stars =
                fixedStars;

            changed =
                true;

            continue;

        }


        /* =================================================
           FALLBACK
           ================================================= */

        const fallbackStars =
            getFallbackCountryStars(
                sticker.country
            );


        if (
            fallbackStars !== null
        ) {

            const detectedFallbackCity =
                findCity(
                    sticker.country,
                    sticker.plate,
                    sticker.department || ""
                );


            if (
                !detectedFallbackCity
            ) {

                sticker.origin =
                    "";

                sticker.kilometers =
                    null;

                sticker.stars =
                    fallbackStars;

                changed =
                    true;

                continue;

            }

        }


        /* =================================================
           IRLANDIA
           
           Ważne:
           Irlandia nie ma stałej rzadkości.

           Każda karta jest przeliczana z odległości
           drogowej, jeżeli mamy miejsce znalezienia.
           ================================================= */

        if (
            sticker.country === "IE"
        ) {

            const irishCity =
                findCity(
                    "IE",
                    sticker.plate,
                    ""
                );


            if (
                irishCity
            ) {

                sticker.origin =
                    irishCity;

            }


            if (
                !irishCity
            ) {

                continue;

            }


            if (
                !sticker.location
            ) {

                continue;

            }


            try {

                const result =
                    await calculateStickerDistance(
                        "IE",
                        irishCity,
                        sticker.location
                    );


                if (result) {

                    sticker.origin =
                        irishCity;

                    sticker.kilometers =
                        result.kilometers;

                    sticker.stars =
                        result.stars;

                    changed =
                        true;

                }

            }

            catch (error) {

                console.warn(
                    "Nie udało się zaktualizować irlandzkiej karty:",
                    sticker.country,
                    sticker.plate,
                    error
                );

            }


            continue;

        }


        /* =================================================
           FRANCJA
           ================================================= */

        if (
            sticker.country === "FR" &&
            sticker.department
        ) {

            const frenchCity =
                findCity(
                    "FR",
                    sticker.plate,
                    sticker.department
                );


            if (
                frenchCity
            ) {

                sticker.origin =
                    frenchCity;

            }

        }


        /* =================================================
           PRÓBA ROZPOZNANIA MIASTA
           ================================================= */

        const detectedCity =
            findCity(
                sticker.country,
                sticker.plate,
                sticker.department || ""
            );


        if (!detectedCity) {

            continue;

        }


        /* =================================================
           MAMY JUŻ MIASTO + KM
           ================================================= */

        if (
            sticker.origin ===
                detectedCity &&

            typeof sticker.kilometers ===
                "number" &&

            Number.isFinite(
                sticker.kilometers
            ) &&

            sticker.kilometers >= 0
        ) {

            sticker.stars =
                calculateStarsFromKilometers(
                    sticker.kilometers
                );

            changed =
                true;

            continue;

        }


        /* =================================================
           BRAK MIEJSCA
           ================================================= */

        if (
            !sticker.location
        ) {

            sticker.origin =
                detectedCity;

            changed =
                true;

            continue;

        }


        /* =================================================
           PRZELICZENIE OSRM
           ================================================= */

        try {

            const result =
                await calculateStickerDistance(
                    sticker.country,
                    detectedCity,
                    sticker.location
                );


            if (result) {

                sticker.origin =
                    detectedCity;

                sticker.kilometers =
                    result.kilometers;

                sticker.stars =
                    result.stars;

                changed =
                    true;

            }

        }

        catch (error) {

            console.warn(
                "Nie udało się zaktualizować karty:",
                sticker.country,
                sticker.plate,
                error
            );

        }

    }


    /* =================================================
       ZAPIS
       ================================================= */

    if (changed) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                stickers
            )
        );

    }


    localStorage.setItem(
        MIGRATION_KEY,
        "done"
    );

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


    /* =====================================================
       SORTOWANIE
       ===================================================== */

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


    /* =====================================================
       PUSTY ALBUM
       ===================================================== */

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


    /* =====================================================
       KARTY
       ===================================================== */

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


    /* =====================================================
       KOLOR
       ===================================================== */

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


    /* =====================================================
       TABLICA
       ===================================================== */

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


    /* =====================================================
       FRANCJA — DEPARTAMENT
       ===================================================== */

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


    /* =====================================================
       POCHODZENIE
       ===================================================== */

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


    /* =====================================================
       MIEJSCE ZNALEZIENIA
       ===================================================== */

    const found =
        document.createElement(
            "div"
        );


    found.className =
        "sticker-location";


    found.textContent =
        "ZNALEZIONA: " +
        sticker.location;


    /* =====================================================
       ODLEGŁOŚĆ
       ===================================================== */

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


    /* =====================================================
       GWIAZDKI
       ===================================================== */

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


    /* =====================================================
       PRZYCISKI
       ===================================================== */

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "sticker-actions";


    /* =====================================================
       EDYTUJ
       ===================================================== */

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


    /* =====================================================
       USUŃ
       ===================================================== */

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
        function () {

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


            deleteSticker(
                sticker
            );


            renderCurrentCountry();

            updateCountryCounters();

            updateCountryCardStates();

        }
    );


    actions.appendChild(
        editButton
    );


    actions.appendChild(
        deleteButton
    );


    /* =====================================================
       SKŁADANIE
       ===================================================== */

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
                    /countries\/([a-z]{2})\.html/i
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
                    /countries\/([a-z]{2})\.html/i
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
                sticker.id ===
                ignoreId
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
   LOCAL STORAGE — POBIERANIE
   ========================================================= */

function getStickers() {

    const data =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!data) {
        return [];
    }


    try {

        const stickers =
            JSON.parse(
                data
            );


        if (
            !Array.isArray(
                stickers
            )
        ) {

            return [];

        }


        return stickers;

    }

    catch (error) {

        console.error(
            "Błąd odczytu naklejek:",
            error
        );


        return [];

    }

}


/* =========================================================
   LOCAL STORAGE — ZAPIS
   ========================================================= */

function saveSticker(
    sticker
) {

    const stickers =
        getStickers();


    stickers.push(
        sticker
    );


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            stickers
        )
    );

}


/* =========================================================
   LOCAL STORAGE — USUWANIE
   ========================================================= */

function deleteSticker(
    stickerToDelete
) {

    const stickers =
        getStickers();


    const filtered =
        stickers.filter(
            function (sticker) {

                if (
                    stickerToDelete.id &&
                    sticker.id
                ) {

                    return (
                        sticker.id !==
                        stickerToDelete.id
                    );

                }


                return !(
                    sticker.country ===
                    stickerToDelete.country &&

                    sticker.plate ===
                    stickerToDelete.plate &&

                    sticker.date ===
                    stickerToDelete.date
                );

            }
        );


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            filtered
        )
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