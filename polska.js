/* =========================================================
   POLSKA.JS
   BAZA WYRÓŻNIKÓW POLSKICH TABLIC REJESTRACYJNYCH

   Zasada:
   Kod -> miejscowość / siedziba powiatu

   Nie używamy nazw typu:
   "powiat goleniowski", "powiat gryfiński" itd.

   Jeśli kod wskazuje na powiat:
   GL -> Goleniów
   GR -> Gryfino
   itd.
   ========================================================= */

const POLSKA_KODY = {


    /* =====================================================
       DOLNOŚLĄSKIE
       ===================================================== */

    DJ: "Jelenia Góra",
    DL: "Legnica",
    DB: "Wałbrzych",
    DW: "Wrocław",
    DX: "Wrocław",

    DBL: "Bolesławiec",
    DDZ: "Dzierżoniów",
    DGL: "Głogów",
    DGR: "Góra",
    DJA: "Jawor",
    DJE: "Jelenia Góra",
    DKA: "Kamienna Góra",
    DKL: "Kłodzko",
    DLE: "Legnica",
    DLB: "Lubań",
    DLU: "Lubin",
    DLW: "Lwówek Śląski",
    DMI: "Milicz",
    DOL: "Oleśnica",
    DOA: "Oława",
    DPL: "Polkowice",
    DST: "Strzelin",
    DSR: "Środa Śląska",
    DSW: "Świdnica",
    DTR: "Trzebnica",
    DBA: "Wałbrzych",
    DWL: "Wołów",
    DWR: "Wrocław",
    DZA: "Ząbkowice Śląskie",
    DZG: "Zgorzelec",
    DZL: "Złotoryja",



    /* =====================================================
       KUJAWSKO-POMORSKIE
       ===================================================== */

    CB: "Bydgoszcz",
    CG: "Grudziądz",
    CT: "Toruń",
    CW: "Włocławek",

    CAL: "Aleksandrów Kujawski",
    CBR: "Brodnica",
    CBY: "Bydgoszcz",
    CBC: "Bydgoszcz",
    CCH: "Chełmno",
    CGD: "Golub-Dobrzyń",
    CGR: "Grudziądz",
    CIN: "Inowrocław",
    CLI: "Lipno",
    CMG: "Mogilno",
    CNA: "Nakło nad Notecią",
    CRA: "Radziejów",
    CRY: "Rypin",
    CSE: "Sępólno Krajeńskie",
    CSW: "Świecie",
    CTR: "Toruń",
    CTU: "Tuchola",
    CWA: "Wąbrzeźno",
    CWL: "Włocławek",
    CZN: "Żnin",



    /* =====================================================
       LUBELSKIE
       ===================================================== */

    LB: "Biała Podlaska",
    LC: "Chełm",
    LU: "Lublin",
    LZ: "Zamość",

    LBI: "Biała Podlaska",
    LBL: "Biłgoraj",
    LCH: "Chełm",
    LHR: "Hrubieszów",
    LJA: "Janów Lubelski",
    LKS: "Krasnystaw",
    LKR: "Kraśnik",
    LLB: "Lubartów",
    LUB: "Lublin",
    LLE: "Łęczna",
    LLU: "Łuków",
    LOP: "Opole Lubelskie",
    LPA: "Parczew",
    LPU: "Puławy",
    LRA: "Radzyń Podlaski",
    LRY: "Ryki",
    LSW: "Świdnik",
    LTM: "Tomaszów Lubelski",
    LWL: "Włodawa",
    LZA: "Zamość",



    /* =====================================================
       LUBUSKIE
       ===================================================== */

    FG: "Gorzów Wielkopolski",
    FZ: "Zielona Góra",

    FGW: "Gorzów Wielkopolski",
    FKR: "Krosno Odrzańskie",
    FMI: "Międzyrzecz",
    FNW: "Nowa Sól",
    FSL: "Słubice",
    FSD: "Strzelce Krajeńskie",
    FSU: "Sulęcin",
    FSW: "Świebodzin",
    FWS: "Wschowa",
    FZI: "Zielona Góra",
    FZG: "Żagań",
    FZA: "Żary",



    /* =====================================================
       ŁÓDZKIE
       ===================================================== */

    EL: "Łódź",
    ED: "Łódź",
    EP: "Piotrków Trybunalski",
    ES: "Skierniewice",

    EBR: "Brzeziny",
    EBE: "Bełchatów",
    EKU: "Kutno",
    ELA: "Łask",
    ELE: "Łęczyca",
    ELC: "Łowicz",
    ELW: "Łódź",
    EOP: "Opoczno",
    EPA: "Pabianice",
    EPJ: "Pajęczno",
    EPI: "Piotrków Trybunalski",
    EPD: "Poddębice",
    ERA: "Radomsko",
    ERW: "Rawa Mazowiecka",
    ESI: "Sieradz",
    ESK: "Skierniewice",
    ETM: "Tomaszów Mazowiecki",
    EWI: "Wieluń",
    EWE: "Wieruszów",
    EZD: "Zduńska Wola",
    EZG: "Zgierz",



    /* =====================================================
       MAŁOPOLSKIE
       ===================================================== */

    KR: "Kraków",
    KK: "Kraków",
    KN: "Nowy Sącz",
    KT: "Tarnów",

    KBC: "Bochnia",
    KBA: "Bochnia",
    KBR: "Brzesko",
    KCH: "Chrzanów",
    KDA: "Dąbrowa Tarnowska",
    KGR: "Gorlice",
    KRA: "Kraków",
    KRK: "Kraków",
    KLI: "Limanowa",
    KMI: "Miechów",
    KMY: "Myślenice",
    KNS: "Nowy Sącz",
    KNT: "Nowy Targ",
    KOL: "Olkusz",
    KOS: "Oświęcim",
    KPR: "Proszowice",
    KSU: "Sucha Beskidzka",
    KTA: "Tarnów",
    KTT: "Zakopane",
    KWA: "Wadowice",
    KWI: "Wieliczka",



    /* =====================================================
       MAZOWIECKIE
       ===================================================== */

    WA: "Warszawa",
    WB: "Warszawa",
    WD: "Warszawa",
    WE: "Warszawa",
    WF: "Warszawa",
    WH: "Warszawa",
    WI: "Warszawa",
    WJ: "Warszawa",
    WK: "Warszawa",
    WN: "Warszawa",
    WT: "Warszawa",
    WU: "Warszawa",
    WW: "Warszawa",
    WX: "Warszawa",
    WY: "Warszawa",

    WO: "Ostrołęka",
    WP: "Płock",
    WR: "Radom",
    WS: "Siedlce",

    WBR: "Białobrzegi",
    WCI: "Ciechanów",
    WG: "Garwolin",
    WGS: "Gostynin",
    WGM: "Grodzisk Mazowiecki",
    WGR: "Grójec",
    WKZ: "Kozienice",
    WL: "Legionowo",
    WLI: "Lipsko",
    WLS: "Łosice",
    WMA: "Maków Mazowiecki",
    WM: "Mińsk Mazowiecki",
    WML: "Mława",
    WND: "Nowy Dwór Mazowiecki",
    WOS: "Ostrołęka",
    WOR: "Ostrów Mazowiecka",
    WOT: "Otwock",
    WPI: "Piaseczno",
    WPA: "Piaseczno",
    WPW: "Piaseczno",
    WPX: "Piaseczno",
    WPL: "Płock",
    WPN: "Płońsk",
    WPR: "Pruszków",
    WPP: "Pruszków",
    WPS: "Pruszków",
    WPZ: "Przasnysz",
    WPY: "Przysucha",
    WPU: "Pułtusk",
    WRA: "Radom",
    WSI: "Siedlce",
    WSE: "Sierpc",
    WSC: "Sochaczew",
    WSK: "Sokołów Podlaski",
    WSZ: "Szydłowiec",
    WZ: "Warszawa Zachodnia",
    WWE: "Węgrów",
    WWL: "Wołomin",
    WLV: "Wołomin",
    WWY: "Wyszków",
    WZW: "Zwoleń",
    WZU: "Żuromin",
    WZY: "Żyrardów",



    /* =====================================================
       OPOLSKIE
       ===================================================== */

    OP: "Opole",

    OB: "Brzeg",
    OGL: "Głubczyce",
    OK: "Kędzierzyn-Koźle",
    OKL: "Kluczbork",
    OKR: "Krapkowice",
    ONA: "Namysłów",
    ONY: "Nysa",
    OOL: "Olesno",
    OPO: "Opole",
    OPR: "Prudnik",
    OST: "Strzelce Opolskie",



    /* =====================================================
       PODKARPACKIE
       ===================================================== */

    RK: "Krosno",
    RP: "Przemyśl",
    RZ: "Rzeszów",
    RT: "Tarnobrzeg",

    RBI: "Ustrzyki Dolne",
    RBR: "Brzozów",
    RDE: "Dębica",
    RJA: "Jarosław",
    RJS: "Jasło",
    RKL: "Kolbuszowa",
    RKR: "Krosno",
    RLS: "Lesko",
    RLE: "Leżajsk",
    RLU: "Lubaczów",
    RLA: "Łańcut",
    RMI: "Mielec",
    RNI: "Nisko",
    RPR: "Przemyśl",
    RPZ: "Przeworsk",
    RRS: "Ropczyce",
    RZE: "Rzeszów",
    RZZ: "Rzeszów",
    RZR: "Rzeszów",
    RSA: "Sanok",
    RST: "Stalowa Wola",
    RSR: "Strzyżów",
    RTA: "Tarnobrzeg",



    /* =====================================================
       PODLASKIE
       ===================================================== */

    BI: "Białystok",
    BL: "Łomża",
    BS: "Suwałki",

    BAU: "Augustów",
    BIA: "Białystok",
    BIB: "Białystok",
    BBI: "Bielsk Podlaski",
    BGR: "Grajewo",
    BHA: "Hajnówka",
    BKL: "Kolno",
    BLM: "Łomża",
    BMN: "Mońki",
    BSE: "Sejny",
    BSI: "Siemiatycze",
    BSK: "Sokółka",
    BSU: "Suwałki",
    BWM: "Wysokie Mazowieckie",
    BZA: "Zambrów",



    /* =====================================================
       POMORSKIE
       ===================================================== */

    GD: "Gdańsk",
    GA: "Gdynia",
    GS: "Słupsk",
    GSP: "Sopot",

    GBY: "Bytów",
    GCH: "Chojnice",
    GCZ: "Człuchów",
    GDA: "Gdańsk",
    GKA: "Kartuzy",
    GKY: "Kartuzy",
    GKZ: "Kartuzy",
    GKS: "Kościerzyna",
    GKW: "Kwidzyn",
    GLE: "Lębork",
    GMB: "Malbork",
    GND: "Nowy Dwór Gdański",
    GPU: "Puck",
    GSL: "Słupsk",
    GST: "Starogard Gdański",
    GSZ: "Sztum",
    GTC: "Tczew",
    GWE: "Wejherowo",
    GWO: "Wejherowo",



    /* =====================================================
       ŚLĄSKIE
       ===================================================== */

    SB: "Bielsko-Biała",
    SY: "Bytom",
    SH: "Chorzów",
    SC: "Częstochowa",
    SD: "Dąbrowa Górnicza",
    SG: "Gliwice",
    SJZ: "Jastrzębie-Zdrój",
    SJ: "Jaworzno",
    SK: "Katowice",
    SM: "Mysłowice",
    SPI: "Piekary Śląskie",
    SR: "Rybnik",
    SI: "Siemianowice Śląskie",
    SO: "Sosnowiec",
    SW: "Świętochłowice",
    ST: "Tychy",
    SZ: "Zabrze",
    SZO: "Żory",

    SBE: "Będzin",
    SBE: "Będzin",
    SBI: "Bielsko-Biała",
    SCI: "Cieszyn",
    SCN: "Cieszyn",
    SCZ: "Częstochowa",
    SGL: "Gliwice",
    SKL: "Kłobuck",
    SLU: "Lubliniec",
    SMI: "Mikołów",
    SMY: "Myszków",
    SPS: "Pszczyna",
    SRC: "Racibórz",
    SRB: "Rybnik",
    STA: "Tarnowskie Góry",
    SBL: "Bieruń",
    SWD: "Wodzisław Śląski",
    SWZ: "Wodzisław Śląski",
    SZA: "Zawiercie",
    SZY: "Żywiec",



    /* =====================================================
       ŚWIĘTOKRZYSKIE
       ===================================================== */

    TK: "Kielce",

    TBU: "Busko-Zdrój",
    TJE: "Jędrzejów",
    TKA: "Kazimierza Wielka",
    TKI: "Kielce",
    TKC: "Kielce",
    TKM: "Kielce",
    TKP: "Kielce",
    TKN: "Końskie",
    TOP: "Opatów",
    TOS: "Ostrowiec Świętokrzyski",
    TPI: "Pińczów",
    TSA: "Sandomierz",
    TSK: "Skarżysko-Kamienna",
    TST: "Starachowice",
    TSZ: "Staszów",
    TLW: "Włoszczowa",



    /* =====================================================
       WARMIŃSKO-MAZURSKIE
       ===================================================== */

    NE: "Elbląg",
    NO: "Olsztyn",

    NBA: "Bartoszyce",
    NBR: "Braniewo",
    NDZ: "Działdowo",
    NEB: "Elbląg",
    NEL: "Ełk",
    NGI: "Giżycko",
    NIL: "Iława",
    NKE: "Kętrzyn",
    NLI: "Lidzbark Warmiński",
    NMR: "Mrągowo",
    NNI: "Nidzica",
    NNM: "Nowe Miasto Lubawskie",
    NOE: "Olecko",
    NGO: "Gołdap",
    NOL: "Olsztyn",
    NOS: "Ostróda",
    NOT: "Ostróda",
    NOX: "Ostróda",
    NPI: "Pisz",
    NSZ: "Szczytno",
    NWE: "Węgorzewo",



    /* =====================================================
       WIELKOPOLSKIE
       ===================================================== */

    PK: "Kalisz",
    PKA: "Kalisz",

    PN: "Konin",
    PKN: "Konin",

    PL: "Leszno",
    PLE: "Leszno",

    PO: "Poznań",
    PY: "Poznań",
    PX: "Poznań",

    PCH: "Chodzież",
    PCT: "Czarnków",
    PGN: "Gniezno",
    PGS: "Gostyń",
    PGO: "Grodzisk Wielkopolski",
    PJA: "Jarocin",
    PKE: "Kępno",
    PKL: "Koło",
    PKN: "Konin",
    PKS: "Kościan",
    PKR: "Krotoszyn",
    PMI: "Międzychód",
    PNT: "Nowy Tomyśl",
    POB: "Oborniki Wielkopolskie",
    POS: "Ostrów Wielkopolski",
    POT: "Ostrzeszów",
    PP: "Piła",
    PPL: "Pleszew",
    POZ: "Poznań",
    POZ: "Poznań",
    PRA: "Rawicz",
    PSL: "Słupca",
    PSZ: "Szamotuły",
    PSR: "Środa Wielkopolska",
    PSE: "Śrem",
    PTU: "Turek",
    PWA: "Wągrowiec",
    PWL: "Wolsztyn",
    PWR: "Września",
    PZL: "Złotów",



    /* =====================================================
       ZACHODNIOPOMORSKIE
       ===================================================== */

    ZK: "Koszalin",
    ZS: "Szczecin",
    ZZ: "Szczecin",
    ZSW: "Świnoujście",

    ZBI: "Białogard",
    ZCH: "Choszczno",
    ZDR: "Drawsko Pomorskie",
    ZGL: "Goleniów",
    ZGY: "Gryfice",
    ZGR: "Gryfino",
    ZKA: "Kamień Pomorski",
    ZKL: "Kołobrzeg",
    ZKO: "Koszalin",
    ZLO: "Łobez",
    ZMY: "Myślibórz",
    ZPL: "Police",
    ZPY: "Pyrzyce",
    ZSL: "Sławno",
    ZST: "Stargard",
    ZSZ: "Szczecinek",
    ZSD: "Świdwin",
    ZWA: "Wałcz"

};