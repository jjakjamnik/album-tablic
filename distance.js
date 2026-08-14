/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   distance.js
   SYSTEM ODLEGŁOŚCI DROGOWEJ
   Nominatim + OSRM
   ========================================================= */


/* =========================================================
   KONFIGURACJA
   ========================================================= */

const NOMINATIM_URL =
    "https://nominatim.openstreetmap.org/search";

const OSRM_URL =
    "https://router.project-osrm.org/route/v1/driving";


/* =========================================================
   GEOKODOWANIE MIEJSCOWOŚCI
   =========================================================

   Zamienia nazwę miejscowości na:
   latitude
   longitude

   countryCode pomaga ograniczyć wyniki
   do odpowiedniego państwa.
   ========================================================= */

async function geocodeLocation(
    location,
    countryCode
) {

    if (!location) {
        return null;
    }


    let query =
        location.trim();


    /*
       Jeżeli znamy kraj, dopisujemy jego kod
       do zapytania.

       Dzięki temu np. "Berlin" nie powinien
       przypadkowo znaleźć Berlina w innym miejscu.
    */

    const countryMap = {

        PL: "Poland",
        DE: "Germany",
        CZ: "Czech Republic",
        DK: "Denmark",
        SE: "Sweden",
        UA: "Ukraine",
        BY: "Belarus",
        NL: "Netherlands",
        BE: "Belgium",
        AT: "Austria",
        FR: "France",
        ES: "Spain",
        IT: "Italy",
        GB: "United Kingdom",
        HU: "Hungary",
        SK: "Slovakia",
        SI: "Slovenia",
        HR: "Croatia",
        RO: "Romania",
        BG: "Bulgaria",
        GR: "Greece",
        PT: "Portugal",
        NO: "Norway",
        FI: "Finland",
        EE: "Estonia",
        LV: "Latvia",
        LT: "Lithuania",
        IE: "Ireland",
        IS: "Iceland",
        CH: "Switzerland",
        AL: "Albania",
        XK: "Kosovo"

    };


    if (
        countryCode &&
        countryMap[countryCode]
    ) {

        query +=
            ", " +
            countryMap[countryCode];

    }


    const url =
        NOMINATIM_URL +
        "?format=jsonv2" +
        "&limit=1" +
        "&q=" +
        encodeURIComponent(query);


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            console.error(
                "Nominatim zwrócił błąd:",
                response.status
            );

            return null;

        }


        const results =
            await response.json();


        if (
            !Array.isArray(results) ||
            results.length === 0
        ) {

            return null;

        }


        return {

            latitude:
                parseFloat(
                    results[0].lat
                ),

            longitude:
                parseFloat(
                    results[0].lon
                ),

            displayName:
                results[0].display_name || ""

        };

    } catch (error) {

        console.error(
            "Błąd geokodowania:",
            error
        );

        return null;

    }

}



/* =========================================================
   ODLEGŁOŚĆ DROGOWA OSRM
   =========================================================

   Zwraca odległość w kilometrach.

   OSRM podaje dystans w metrach.
   ========================================================= */

async function getRoadDistance(
    from,
    to
) {

    if (!from || !to) {
        return null;
    }


    const coordinates =
        from.longitude +
        "," +
        from.latitude +
        ";" +
        to.longitude +
        "," +
        to.latitude;


    const url =
        OSRM_URL +
        "/" +
        coordinates +
        "?overview=false";


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            console.error(
                "OSRM zwrócił błąd:",
                response.status
            );

            return null;

        }


        const data =
            await response.json();


        if (
            data.code !== "Ok" ||
            !data.routes ||
            data.routes.length === 0
        ) {

            return null;

        }


        /*
           OSRM → metry
           Album → kilometry
        */

        const meters =
            data.routes[0].distance;


        const kilometers =
            meters / 1000;


        return kilometers;

    } catch (error) {

        console.error(
            "Błąd OSRM:",
            error
        );

        return null;

    }

}



/* =========================================================
   GWIAZDKI NA PODSTAWIE KILOMETRÓW
   =========================================================

   0 - 200 km       → ★
   201 - 500 km     → ★★
   501 - 1000 km    → ★★★
   1001 - 2000 km   → ★★★★
   2000+ km         → ★★★★★
   ========================================================= */

function getDistanceStars(
    kilometers
) {

    if (
        typeof kilometers !== "number" ||
        !Number.isFinite(kilometers)
    ) {

        return 0;

    }


    if (kilometers <= 200) {

        return 1;

    }


    if (kilometers <= 500) {

        return 2;

    }


    if (kilometers <= 1000) {

        return 3;

    }


    if (kilometers <= 2000) {

        return 4;

    }


    return 5;

}



/* =========================================================
   FORMATOWANIE ODLEGŁOŚCI
   ========================================================= */

function formatDistance(
    kilometers
) {

    if (
        typeof kilometers !== "number" ||
        !Number.isFinite(kilometers)
    ) {

        return "—";

    }


    /*
       Zaokrąglamy do pełnego kilometra.
    */

    return (
        Math.round(kilometers) +
        " km"
    );

}



/* =========================================================
   FORMATOWANIE GWIAZDEK
   ========================================================= */

function formatDistanceStars(
    kilometers
) {

    const stars =
        getDistanceStars(
            kilometers
        );


    if (!stars) {

        return "—";

    }


    return "★".repeat(stars);

}



/* =========================================================
   GŁÓWNA FUNKCJA
   =========================================================

   Ta funkcja jest przeznaczona do użycia
   przez script.js.

   Przykład:

   const result =
       await calculateStickerDistance(
           "DE",
           "Hamburg",
           "Świnoujście"
       );

   Wynik:

   {
       kilometers: 420,
       stars: 2,
       distanceText: "420 km",
       starsText: "★★"
   }

   ========================================================= */

async function calculateStickerDistance(
    countryCode,
    origin,
    foundLocation
) {

    if (
        !countryCode ||
        !origin ||
        !foundLocation
    ) {

        return null;

    }


    /* =====================================================
       POCHODZENIE TABLICY
       ===================================================== */

    const originCoordinates =
        await geocodeLocation(
            origin,
            countryCode
        );


    if (!originCoordinates) {

        console.warn(
            "Nie udało się znaleźć miejscowości pochodzenia:",
            origin
        );

        return null;

    }


    /* =====================================================
       MIEJSCE ZNALEZIENIA
       ===================================================== */

    const foundCoordinates =
        await geocodeLocation(
            foundLocation,
            "PL"
        );


    if (!foundCoordinates) {

        console.warn(
            "Nie udało się znaleźć miejsca znalezienia:",
            foundLocation
        );

        return null;

    }


    /* =====================================================
       OSRM
       ===================================================== */

    const kilometers =
        await getRoadDistance(
            originCoordinates,
            foundCoordinates
        );


    if (
        typeof kilometers !== "number"
    ) {

        return null;

    }


    /* =====================================================
       GWIAZDKI
       ===================================================== */

    let stars;

    if (countryCode === "IT") {

        /*
           Włochy mają zawsze 4 gwiazdki,
           niezależnie od faktycznej odległości.
        */

        stars = 4;

    } else {

        stars =
            getDistanceStars(
                kilometers
            );

    }


    return {

        kilometers:
            Math.round(
                kilometers
            ),

        stars:
            stars,

        distanceText:
            formatDistance(
                kilometers
            ),

        starsText:
            "★".repeat(stars)

    };

}



/* =========================================================
   GOTOWE
   ========================================================= */