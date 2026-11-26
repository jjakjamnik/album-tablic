/* =========================================================
   UZBEKISTAN — ROZPOZNAWANIE TABLIC
   ========================================================= */

const UZBEKISTAN_KODY = {

    "01": "Taszkent"

};


/* =========================================================
   ODCZYT KODU REGIONU
   ========================================================= */

function findUzbekistanCity(plate) {

    if (!plate) {
        return null;
    }

    const cleanPlate = plate
        .toUpperCase()
        .replace(/[\s-]/g, "");

    const regionCode =
        cleanPlate.substring(0, 2);

    return UZBEKISTAN_KODY[regionCode] || null;

}
