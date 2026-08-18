/* =========================================================
   AUSTRIA.JS
   BAZA WYRÓŻNIKÓW AUSTRIACKICH TABLIC REJESTRACYJNYCH

   Zasada:
   Kod -> miejscowość / obszar właściwy dla kodu

   Przykłady:
   LZ -> Lienz
   W  -> Wiedeń
   S  -> Salzburg
   ========================================================= */

const AUSTRIA_KODY = {


    /* =====================================================
       BURGENLAND
       ===================================================== */

    E: "Eisenstadt",
    EU: "Eisenstadt-Umgebung",
    GS: "Güssing",
    JE: "Jennersdorf",
    MA: "Mattersburg",
    ND: "Neusiedl am See",
    OP: "Oberpullendorf",
    OW: "Oberwart",


    /* =====================================================
       KARYNTIA
       ===================================================== */

    FE: "Feldkirchen",
    HE: "Hermagor",
    K: "Klagenfurt",
    KL: "Klagenfurt-Land",
    SP: "Spittal an der Drau",
    SV: "Sankt Veit an der Glan",
    VI: "Villach",
    VK: "Völkermarkt",
    VL: "Villach-Land",
    WO: "Wolfsberg",


    /* =====================================================
       DOLNA AUSTRIA
       ===================================================== */

    AM: "Amstetten",
    BL: "Bruck an der Leitha",
    BN: "Baden",
    GD: "Gmünd",
    GF: "Gänserndorf",
    HL: "Hollabrunn",
    HO: "Horn",
    KG: "Klosterneuburg",
    KO: "Korneuburg",
    KR: "Krems-Land",
    KS: "Krems an der Donau",
    LF: "Lilienfeld",
    MD: "Mödling",
    ME: "Melk",
    MI: "Mistelbach",
    NK: "Neunkirchen",
    P: "Sankt Pölten",
    PL: "Sankt Pölten-Land",
    SB: "Scheibbs",
    SW: "Schwechat",
    TU: "Tulln",
    WB: "Wiener Neustadt-Land",
    WN: "Wiener Neustadt",
    WT: "Waidhofen an der Thaya",
    WY: "Waidhofen an der Ybbs",
    ZT: "Zwettl",

    /*
       Stary wyróżnik Wien-Umgebung.
       Nadal spotykany na ważnych, wcześniej wydanych tablicach.
    */

    WU: "Wien-Umgebung",


    /* =====================================================
       GÓRNA AUSTRIA
       ===================================================== */

    BR: "Braunau am Inn",
    EF: "Eferding",
    FR: "Freistadt",
    GM: "Gmunden",
    GR: "Grieskirchen",
    KI: "Kirchdorf an der Krems",
    L: "Linz",
    LL: "Linz-Land",
    PE: "Perg",
    RI: "Ried im Innkreis",
    RO: "Rohrbach",
    SD: "Schärding",
    SE: "Steyr-Land",
    SR: "Steyr",
    UU: "Urfahr-Umgebung",
    VB: "Vöcklabruck",
    WE: "Wels",
    WL: "Wels-Land",


    /* =====================================================
       SALZBURG
       ===================================================== */

    HA: "Hallein",
    JO: "Sankt Johann im Pongau",
    S: "Salzburg",
    SL: "Salzburg-Umgebung",
    TA: "Tamsweg",
    ZE: "Zell am See",


    /* =====================================================
       STYRIA
       ===================================================== */

    BA: "Bad Aussee",
    BM: "Bruck-Mürzzuschlag",
    DL: "Deutschlandsberg",
    G: "Graz",
    GB: "Gröbming",
    GU: "Graz-Umgebung",
    HF: "Hartberg-Fürstenfeld",
    LB: "Leibnitz",
    LE: "Leoben",
    LI: "Liezen",
    LN: "Leoben-Land",
    MT: "Murtal",
    MU: "Murau",
    SO: "Südoststeiermark",
    VO: "Voitsberg",
    WZ: "Weiz",


    /* =====================================================
       TYROL
       ===================================================== */

    I: "Innsbruck",
    IL: "Innsbruck-Land",
    IM: "Imst",
    KB: "Kitzbühel",
    KU: "Kufstein",
    LA: "Landeck",
    LZ: "Lienz",
    RE: "Reutte",
    SZ: "Schwaz",


    /* =====================================================
       VORARLBERG
       ===================================================== */

    B: "Bregenz",
    BZ: "Bludenz",
    DO: "Dornbirn",
    FK: "Feldkirch",


    /* =====================================================
       WIEDEŃ
       ===================================================== */

    W: "Wiedeń"

};