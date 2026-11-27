
/* =========================================================
   ALBUM 3.0 — PAPER.JS
   Wersja 6 — prawdziwe przewracanie kartki
   Przód: aktualna strona
   Tył: następna strona
   ========================================================= */

(function () {
    "use strict";

    const ANIMATION_DURATION = 1500;
    const CLEANUP_DELAY = 100;

    let isTurning = false;
    let animationStyle = null;


    /* =====================================================
       STYLE ANIMACJI
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
                position: absolute;
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
                opacity: 1 !important;
                backface-visibility: hidden !important;
                -webkit-backface-visibility: hidden !important;
            }

            .album-page-turn-front {
                transform: rotateY(0deg) translateZ(0.7px);
            }

            .album-page-turn-back {
                transform: rotateY(180deg) translateZ(0.7px);
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


    function getPage(spread, side) {

        if (!spread) return null;

        return spread.querySelector(
            '[data-page-side="' + side + '"]'
        );
    }


    function getTurningSide(direction) {

        return direction === "next"
            ? "right"
            : "left";
    }


    function getBackSide(direction) {

        return direction === "next"
            ? "left"
            : "right";
    }


    function getPreservedSide(direction) {

        return direction === "next"
            ? "left"
            : "right";
    }


    /* =====================================================
       KOPIOWANIE STRONY
       ===================================================== */

    function removeCloneIds(element) {

        element.removeAttribute("id");

        element.querySelectorAll("[id]").forEach(function (item) {
            item.removeAttribute("id");
        });
    }


    function createPageClone(sourcePage, className) {

        if (!sourcePage) return null;

        const rect =
            sourcePage.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return null;
        }

        const clone =
            sourcePage.cloneNode(true);

        removeCloneIds(clone);

        clone.classList.add(className);

        clone.inert = true;
        clone.setAttribute("aria-hidden", "true");

        clone.style.left = rect.left + "px";
        clone.style.top = rect.top + "px";
        clone.style.width = rect.width + "px";
        clone.style.height = rect.height + "px";

        return {
            element: clone,
            rect: rect
        };
    }


    /* =====================================================
       NIERUCHOMA STRONA PODCZAS ANIMACJI
       ===================================================== */

    function createPreservedOverlay(sourcePage) {

        const copy = createPageClone(
            sourcePage,
            "album-page-turn-overlay"
        );

        if (!copy) return null;

        document.body.appendChild(copy.element);

        return copy.element;
    }


    /* =====================================================
       PRZYGOTOWANIE KARTKI Z DWOMA STRONAMI
       ===================================================== */

    function createTurningSheet(
        frontPage,
        backPage,
        direction
    ) {

        if (!frontPage || !backPage) {
            return null;
        }

        const frontCopy = createPageClone(
            frontPage,
            "album-page-turn-face album-page-turn-front"
        );

        const backCopy = createPageClone(
            backPage,
            "album-page-turn-face album-page-turn-back"
        );

        if (!frontCopy || !backCopy) {
            return null;
        }

        const rect = frontCopy.rect;

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

        // Obie strony muszą mieć identyczne wymiary.
        backCopy.element.style.left = "0";
        backCopy.element.style.top = "0";
        backCopy.element.style.width = "100%";
        backCopy.element.style.height = "100%";

        frontCopy.element.style.left = "0";
        frontCopy.element.style.top = "0";
        frontCopy.element.style.width = "100%";
        frontCopy.element.style.height = "100%";

        sheet.appendChild(frontCopy.element);
        sheet.appendChild(backCopy.element);

        sheet.style.transformOrigin =
            direction === "next"
                ? "left center"
                : "right center";

        stage.appendChild(sheet);
        document.body.appendChild(stage);

        return {
            stage: stage,
            sheet: sheet
        };
    }


    /* =====================================================
       PRZYGOTOWANIE DOCELOWEJ ROZKŁADÓWKI
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
       ANIMACJA PRZEWRACANIA
       ===================================================== */

    function turnPage(
        direction,
        prepareDestination,
        onComplete
    ) {

        if (
            window.matchMedia("(max-width: 750px)").matches
        ) {
            if (prepareDestination) {
                prepareDestination();
            }

            if (onComplete) {
                onComplete();
            }

            return;
        }

        if (isTurning) return;

        const currentSpread =
            getVisibleSpread();

        if (!currentSpread) return;

        const turningSide =
            getTurningSide(direction);

        const preservedSide =
            getPreservedSide(direction);

        const originalFront =
            getPage(currentSpread, turningSide);

        const originalPreserved =
            getPage(currentSpread, preservedSide);

        if (!originalFront) return;

        installAnimationStyles();

        // Zapamiętujemy nieruchomą stronę starej rozkładówki.
        const preservedOverlay =
            createPreservedOverlay(originalPreserved);

        isTurning = true;

        // Przygotowujemy nową rozkładówkę pod kartką.
        if (prepareDestination) {
            prepareDestination();
        }

        const destinationSpread =
            getVisibleSpread();

        const destinationBack =
            getPage(
                destinationSpread,
                getBackSide(direction)
            );

        if (!destinationBack) {

            if (preservedOverlay) {
                preservedOverlay.remove();
            }

            isTurning = false;

            if (onComplete) onComplete();

            return;
        }

        // Przód kartki: stara strona.
        // Tył kartki: nowa strona.
        const turningSheet =
            createTurningSheet(
                originalFront,
                destinationBack,
                direction
            );

        if (!turningSheet) {

            if (preservedOverlay) {
                preservedOverlay.remove();
            }

            isTurning = false;

            return;
        }

        const sheet =
            turningSheet.sheet;

        const isNext =
            direction === "next";

        let finished = false;

        function finishAnimation() {

            if (finished) return;

            finished = true;

            turningSheet.stage.remove();

            if (preservedOverlay) {
                preservedOverlay.remove();
            }

            isTurning = false;

            if (onComplete) {
                onComplete();
            }
        }

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

        animation.onfinish = function () {

            window.setTimeout(
                finishAnimation,
                CLEANUP_DELAY
            );

        };

        animation.oncancel = finishAnimation;
    }


    /* =====================================================
       POWRÓT DO SPISU TREŚCI
       ===================================================== */

    function returnToToc() {

        turnPage(
            "previous",
            function () {
                showAlbumFrontmatter();
            }
        );
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

        // Na telefonie pozostaje zwykła nawigacja.
        if (
            window.matchMedia("(max-width: 750px)").matches
        ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (isTurning) return;


        /* ================================================
           SPIS TREŚCI → WYBRANY KRAJ
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
           PRZYCISK OTWÓRZ ALBUM
           ================================================ */

        if (
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
           POWRÓT DO SPISU TREŚCI
           ================================================ */

        if (
            button.matches("#album-toc-return")
        ) {

            returnToToc();

            return;
        }


        /* ================================================
           POPRZEDNIA / NASTĘPNA
           ================================================ */

        if (
            button.matches("#album-pagination button")
        ) {

            const text =
                button.textContent.trim();

            if (text.includes("SPIS TREŚCI")) {
                returnToToc();
                return;
            }

            let direction = null;

            if (text.includes("NASTĘPNA")) {
                direction = "next";
            }

            if (text.includes("POPRZEDNIA")) {
                direction = "previous";
            }

            if (!direction) return;

            const targetPage =
                direction === "next"
                    ? currentCountryPage + 1
                    : currentCountryPage - 1;

            // Powrót z pierwszej rozkładówki do spisu.
            if (targetPage < 1) {
                returnToToc();
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
        "Album 3.0 — przewracanie kartek v6 załadowane"
    );

})();
