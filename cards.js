/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   cards.js
   SYSTEM GENEROWANIA POJEDYNCZEJ KARTY

   KOLORY RZADKOŚCI:
   ★      — BRĄZOWY
   ★★     — NIEBIESKI
   ★★★    — ZIELONY
   ★★★★   — CZERWONY
   ★★★★★  — CZARNY

   SPECIAL — ZŁOTY
========================================================= */


/* =========================================================
   TWORZENIE KARTY
========================================================= */

function createStickerCard(sticker) {

    const article =
        document.createElement("article");


    /* =====================================================
       KOLOR NAKLEJKI
    ===================================================== */

    let stickerClass =
        "sticker-brown";


    /* -----------------------------------------------------
       SPECIAL — ZŁOTA KARTA
       ----------------------------------------------------- */

    if (
        sticker.owner === "special"
    ) {

        stickerClass =
            "sticker-gold";

    }

    /* -----------------------------------------------------
       RZADKOŚĆ — KOLOR WG GWIAZDEK
       ----------------------------------------------------- */

    else {

        const stars =
            Number(sticker.stars) || 1;


        if (stars === 1) {

            stickerClass =
                "sticker-brown";

        }

        else if (stars === 2) {

            stickerClass =
                "sticker-blue";

        }

        else if (stars === 3) {

            stickerClass =
                "sticker-green";

        }

        else if (stars === 4) {

            stickerClass =
                "sticker-red";

        }

        else if (stars >= 5) {

            stickerClass =
                "sticker-black";

        }

    }


    article.className =
        "sticker " +
        stickerClass;


    /* =====================================================
       TABLICA
    ===================================================== */

    const plate =
        document.createElement("div");


    plate.className =
        "plate plate-" +
        sticker.country.toLowerCase();


    /* -----------------------------------------------------
       KRAJ
    ----------------------------------------------------- */

    const country =
        document.createElement("div");


    country.className =
        "plate-country";


    country.textContent =
        sticker.country;


    /* -----------------------------------------------------
       NUMER
    ----------------------------------------------------- */

    const number =
        document.createElement("div");


    number.className =
        "plate-number";


    number.textContent =
        sticker.plate;


    /* -----------------------------------------------------
       SKŁADANIE TABLICY
    ----------------------------------------------------- */

    plate.appendChild(
        country
    );


    plate.appendChild(
        number
    );


    /* =====================================================
       POCHODZENIE TABLICY
    ===================================================== */

    const origin =
        document.createElement("div");


    origin.className =
        "plate-origin";


    let originText =
        sticker.origin;


    /*
       Jeżeli pochodzenie nie zostało zapisane,
       próbujemy rozpoznać je ponownie.
    */

    if (!originText) {

        originText =
            findCity(
                sticker.country,
                sticker.plate
            ) || "";

    }


    origin.textContent =
        originText;


    /* =====================================================
       MIEJSCE ZNALEZIENIA
    ===================================================== */

    const found =
        document.createElement("div");


    found.className =
        "sticker-location";


    found.textContent =
        "ZNALEZIONA: " +
        sticker.location;


    /* =====================================================
       ODLEGŁOŚĆ
    ===================================================== */

    const distance =
        document.createElement("div");


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
        document.createElement("div");


    stars.className =
        "sticker-stars";


    const starCount =
        Number(sticker.stars) || 0;


    if (
        starCount > 0
    ) {

        stars.textContent =
            "★".repeat(
                Math.min(
                    starCount,
                    5
                )
            );

    }

    else {

        stars.textContent =
            "—";

    }


    /* =====================================================
       PRZYCISK USUWANIA
    ===================================================== */

    const deleteButton =
        document.createElement("button");


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


    /* =====================================================
       SKŁADANIE KARTY
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
        deleteButton
    );


    return article;

}