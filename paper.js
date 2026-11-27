
/* =========================================================
   ALBUM 3.0 — PAPER.JS
   Przewracanie kartek — wersja 5
   Nowa strona przygotowywana pod kartką
   ========================================================= */

(function () {
    "use strict";

    const ANIMATION_DURATION = 1500;
    const CLEANUP_DELAY = 120;

    let isTurning = false;
    let animationStyle = null;


    /* =====================================================
       STYLE
       ===================================================== */

    function installAnimationStyles() {

        if (animationStyle) return;

        animationStyle = document.createElement("style");

        animationStyle.textContent = `

            .album-page-turn-stage {
                position: fixed;
                inset: 0;
                z-index: 2147483000;
                pointer-events: none;
                perspective: 2200px;
                perspective-origin: center center;
                overflow: visible;
            }

            .album-page-turn-sheet {
                position: fixed;
                box-sizing: border-box;
                transform-style: preserve-3d;
                backface-visibility: visible;
                -webkit-backface-visibility: visible;
                pointer-events: none;
                will-change: transform, filter;
            }

            .album-page-turn-face {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                background-color: #eee5d2;
                opacity: 1;
                backface-visibility: hidden !important;
                -webkit-backface-visibility: hidden !important;
            }

            .album-page-turn-front {
                transform: rotateY(0deg) translateZ(0.7px);
            }

            .album-page-turn-back {
                transform: rotateY(180deg) translateZ(0.7px);
                background-color: #eee5d2;

                background-image:
                    radial-gradient(
                        ellipse at 20% 15%,
                        rgba(255,255,255,.35),
                        transparent 55%
                    ),
                    radial-gradient(
                        ellipse at 90% 90%,
                        rgba(80,60,35,.09),
                        transparent 60%
                    ),
                    repeating-linear-gradient(
                        0deg,
                        rgba(80,60,35,.025) 0px,
                        transparent 1px,
                        transparent 5px
                    );

                border: 1px solid rgba(100,80,55,.2);
            }

            .album-page-turn-overlay {
                position: fixed !important;
                z-index: 2147482999 !important;
                margin: 0 !important;
                pointer-events: none !important;
                overflow: hidden !important;
            }

        `;

        document.head.appendChild(animationStyle);
    }


    /* =====================================================
       ELEMENTY ALBUMU
       ===================================================== */

    function getVisibleSpread() {

        const frontmatter =
            document.getElementById("album-frontmatter");

        const spread =
            document.getElementById("album-spread");

        if (frontmatter && !frontmatter.hidden) {
            return frontmatter;
        }

        if (spread && !spread.hidden) {
            return spread;
        }

        return null;
    }


    function getPageToTurn(direction) {

        const spread = getVisibleSpread();

        if (!spread) return null;

        const side = direction === "next"
            ? "right"
            : "left";

        return spread.querySelector(
            '[data-page-side="' + side + '"]'
        );
    }


    function getPageToPreserve(direction) {

        const spread = getVisibleSpread();

        if (!spread) return null;

        const side = direction === "next"
            ? "left"
            : "right";

        return spread.querySelector(
            '[data-page-side="' + side + '"]'
        );
    }


    /* =====================================================
       USUWANIE ID Z KOPII
       ===================================================== */

    function removeCloneIds(element) {

        element.removeAttribute("id");

        element.querySelectorAll("[id]").forEach(function (item) {
            item.removeAttribute("id");
        });
    }


    /* =====================================================
       KOPIA STRONY, KTÓRA NIE JEST PRZEWRACANA
       ===================================================== */

    function createPageOverlay(originalPage) {

        if (!originalPage) return null;

        const rect =
            originalPage.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return null;
        }

        const overlay =
            originalPage.cloneNode(true);

        removeCloneIds(overlay);

        overlay.classList.add(
            "album-page-turn-overlay"
        );

        overlay.inert = true;
        overlay.setAttribute("aria-hidden", "true");

        overlay.style.left = rect.left + "px";
        overlay.style.top = rect.top + "px";
        overlay.style.width = rect.width + "px";
        overlay.style.height = rect.height + "px";

        document.body.appendChild(overlay);

        return overlay;
    }


    /* =====================================================
       PRZYGOTOWANIE PRZEWRACANEJ KARTKI
       ===================================================== */

    function createTurningSheet(originalPage, direction) {

        const rect =
            originalPage.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return null;
        }

        const stage =
            document.createElement("div");

        stage.className =
            "album-page-turn-stage";

        const sheet =
            document.createElement("div");

        sheet.className =
            "album-page-turn-sheet";

        sheet.style.left = rect.left + "px";
        sheet.style.top = rect.top + "px";
        sheet.style.width = rect.width + "px";
        sheet.style.height = rect.height + "px";

        const front =
            originalPage.cloneNode(true);

        removeCloneIds(front);

        front.classList.add(
            "album-page-turn-face",
            "album-page-turn-front"
        );

        front.inert = true;
        front.setAttribute("aria-hidden", "true");

        const originalStyle =
            getComputedStyle(originalPage);

        front.style.backgroundColor =
            originalStyle.backgroundColor;

        front.style.backgroundImage =
            originalStyle.backgroundImage;

        front.style.opacity = "1";

        front.style.backfaceVisibility =
            "hidden";

        front.style.webkitBackfaceVisibility =
            "hidden";

        const back =
            document.createElement("div");

        back.className =
            "album-page-turn-face album-page-turn-back";

        back.setAttribute("aria-hidden", "true");

        back.style.opacity = "1";

        back.style.backfaceVisibility =
            "hidden";

        back.style.webkitBackfaceVisibility =
            "hidden";

        sheet.appendChild(front);
        sheet.appendChild(back);

        stage.appendChild(sheet);

        document.body.appendChild(stage);

        sheet.style.transformOrigin =
            direction === "next"
                ? "left center"
                : "right center";

        return {
            stage: stage,
            sheet: sheet
        };
    }


    /* =====================================================
       PRZYGOTOWANIE NOWEJ ROZKŁADÓWKI POD KARTKĄ
       ===================================================== */

    function showCountrySpread(targetPage) {

        const frontmatter =
            document.getElementById("album-frontmatter");

        const frontmatterNavigation =
            document.querySelector(
                ".album-frontmatter-navigation"
            );

        const spread =
            document.getElementById("album-spread");

        if (frontmatter) {
            frontmatter.hidden = true;
        }

        if (frontmatterNavigation) {
            frontmatterNavigation.hidden = true;
        }

        if (spread) {
            spread.hidden = false;
        }

        currentCountryPage = targetPage;

        renderCurrentCountry();

        const pagination =
            document.getElementById("album-pagination");

        if (pagination) {
            pagination.hidden = false;
        }
    }


    /* =====================================================
       ANIMACJA
       ===================================================== */

    function turnPage(direction, prepareDestination, onComplete) {

        if (
            window.matchMedia("(max-width: 750px)").matches
        ) {
            if (onComplete) onComplete();
            return;
        }

        if (isTurning) return;

        const originalPage =
            getPageToTurn(direction);

        if (!originalPage) {
            if (onComplete) onComplete();
            return;
        }

        installAnimationStyles();

        // Najpierw kopiujemy starą kartkę.
        const turningSheet =
            createTurningSheet(originalPage, direction);

        if (!turningSheet) {
            if (onComplete) onComplete();
            return;
        }

        // Zachowujemy stronę, która nie będzie przewracana.
        const preservedPage =
            getPageToPreserve(direction);

        const overlay =
            createPageOverlay(preservedPage);

        isTurning = true;

        // Przygotowujemy nową zawartość POD przewracaną kartką.
        if (prepareDestination) {
            prepareDestination();
        }

        const sheet = turningSheet.sheet;

        const isNext = direction === "next";

        const animation = sheet.animate(
            [
                {
                    transform: "rotateY(0deg)",
                    filter:
                        "drop-shadow(0 2px 3px rgba(0,0,0,.12))"
                },
                {
                    offset: 0.35,
                    filter:
                        "drop-shadow(0 8px 12px rgba(0,0,0,.22))"
                },
                {
                    offset: 0.65,
                    filter:
                        "drop-shadow(0 10px 14px rgba(0,0,0,.26))"
                },
                {
                    transform: isNext
                        ? "rotateY(-180deg)"
                        : "rotateY(180deg)",
                    filter:
                        "drop-shadow(0 3px 5px rgba(0,0,0,.12))"
                }
            ],
            {
                duration: ANIMATION_DURATION,
                easing: "cubic-bezier(.45,.05,.2,1)",
                fill: "forwards"
            }
        );

        let finished = false;

        function finishAnimation() {

            if (finished) return;

            finished = true;

            turningSheet.stage.remove();

            if (overlay) {
                overlay.remove();
            }

            isTurning = false;

            if (onComplete) {
                onComplete();
            }
        }

        animation.onfinish = function () {

            window.setTimeout(
                finishAnimation,
                CLEANUP_DELAY
            );

        };

        animation.oncancel = finishAnimation;
    }


    /* =====================================================
       ROZPOZNAWANIE KIERUNKU
       ===================================================== */

    function getDirection(button) {

        if (
            button.matches("#album-frontmatter-next")
        ) {
            return "next";
        }

        if (
            button.matches("#album-toc-return")
        ) {
            return "previous";
        }

        if (
            button.matches("#album-pagination button")
        ) {

            const text =
                button.textContent.trim();

            if (text.includes("NASTĘPNA")) {
                return "next";
            }

            if (text.includes("POPRZEDNIA")) {
                return "previous";
            }
        }

        return null;
    }


    /* =====================================================
       OBSŁUGA KLIKNIĘĆ
       ===================================================== */

    document.addEventListener("click", function (event) {

        const target = event.target;

        if (
            !target ||
            typeof target.closest !== "function"
        ) {
            return;
        }

        const button = target.closest(
            "#album-frontmatter-next, " +
            "#album-toc-return, " +
            "#album-pagination button"
        );

        const link =
            target.closest("[data-country-jump]");

        if (!button && !link) return;

        const direction = button
            ? getDirection(button)
            : "next";

        if (!direction) return;

        // Telefon: zwykła, natychmiastowa nawigacja.
        if (
            window.matchMedia("(max-width: 750px)").matches
        ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (isTurning) return;


        /* ================================================
           POWRÓT DO SPISU TREŚCI
           ================================================ */

        if (
            button &&
            button.matches("#album-toc-return")
        ) {

            turnPage(
                "previous",
                null,
                function () {
                    showAlbumFrontmatter();
                }
            );

            return;
        }


        /* ================================================
           PRZEJŚCIE ZE STRONY 1 DO ALBUMU
           ================================================ */

        if (
            button &&
            button.matches("#album-frontmatter-next")
        ) {

            const firstCountryLink =
                document.querySelector(
                    "#album-toc-countries [data-country-jump]"
                );

            if (!firstCountryLink) return;

            const spreadIndex = Number(
                firstCountryLink.dataset.albumSpreadIndex
            );

            const targetPage =
                Number.isFinite(spreadIndex)
                    ? spreadIndex + 1
                    : 1;

            turnPage(
                "next",
                function () {
                    showCountrySpread(targetPage);
                }
            );

            return;
        }


        /* ================================================
           PRZEJŚCIE Z POZIOMU SPISU TREŚCI
           ================================================ */

        if (link) {

            const spreadIndex = Number(
                link.dataset.albumSpreadIndex
            );

            if (!Number.isFinite(spreadIndex)) {
                return;
            }

            const targetPage =
                spreadIndex + 1;

            turnPage(
                "next",
                function () {
                    showCountrySpread(targetPage);
                }
            );

            return;
        }


        /* ================================================
           POPRZEDNIA / NASTĘPNA ROZKŁADÓWKA
           ================================================ */

        if (
            button &&
            button.matches("#album-pagination button")
        ) {

            const currentPage =
                currentCountryPage;

            let targetPage;

            if (direction === "next") {
                targetPage = currentPage + 1;
            } else {
                targetPage = currentPage - 1;
            }

            // Powrót z pierwszej rozkładówki do spisu.
            if (targetPage < 1) {

                turnPage(
                    "previous",
                    null,
                    function () {
                        showAlbumFrontmatter();
                    }
                );

                return;
            }

            turnPage(
                direction,
                function () {
                    showCountrySpread(targetPage);
                }
            );

        }

    }, true);


    console.log(
        "Album 3.0 — mechanizm przewracania kartek v5 załadowany"
    );

})();
