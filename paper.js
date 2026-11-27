
/* =========================================================
   ALBUM 3.0 — PAPER.JS
   Przewracanie kartek — wersja 4
   ========================================================= */

(function () {
    "use strict";

    const ANIMATION_DURATION = 1500;
    const CLEANUP_DELAY = 120;

    let isTurning = false;
    let replayingClick = false;
    let animationStyle = null;


    /* =====================================================
       STYLE — NIEZALEŻNY OD paper.css
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


    /* =====================================================
       PRZYGOTOWANIE KOPII KARTKI
       ===================================================== */

    function removeCloneIds(element) {

        element.removeAttribute("id");

        element.querySelectorAll("[id]").forEach(function (item) {
            item.removeAttribute("id");
        });
    }


    function createTurningSheet(originalPage, direction) {

        const rect = originalPage.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return null;
        }

        const stage = document.createElement("div");
        stage.className = "album-page-turn-stage";

        const sheet = document.createElement("div");
        sheet.className = "album-page-turn-sheet";

        sheet.style.left = rect.left + "px";
        sheet.style.top = rect.top + "px";
        sheet.style.width = rect.width + "px";
        sheet.style.height = rect.height + "px";

        const front = originalPage.cloneNode(true);

        removeCloneIds(front);

        front.classList.add(
            "album-page-turn-face",
            "album-page-turn-front"
        );

        front.inert = true;
        front.setAttribute("aria-hidden", "true");

        const originalStyle = getComputedStyle(originalPage);

        front.style.backgroundColor =
            originalStyle.backgroundColor;

        front.style.backgroundImage =
            originalStyle.backgroundImage;

        front.style.opacity = "1";
        front.style.backfaceVisibility = "hidden";
        front.style.webkitBackfaceVisibility = "hidden";

        const back = document.createElement("div");

        back.className =
            "album-page-turn-face album-page-turn-back";

        back.setAttribute("aria-hidden", "true");

        back.style.opacity = "1";
        back.style.backfaceVisibility = "hidden";
        back.style.webkitBackfaceVisibility = "hidden";

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
            sheet: sheet,
            direction: direction
        };
    }


    /* =====================================================
       ANIMACJA I ZMIANA STRON
       ===================================================== */

    function turnPage(direction, onComplete) {

        // Telefon: bez animacji 3D.
        if (window.matchMedia("(max-width: 750px)").matches) {
            if (onComplete) onComplete();
            return;
        }

        if (isTurning) return;

        const originalPage = getPageToTurn(direction);

        if (!originalPage) {
            if (onComplete) onComplete();
            return;
        }

        installAnimationStyles();

        const turningSheet =
            createTurningSheet(originalPage, direction);

        if (!turningSheet) {
            if (onComplete) onComplete();
            return;
        }

        isTurning = true;

        const originalVisibility =
            originalPage.style.visibility;

        // Ukrywamy oryginalną kartkę.
        // Jej kopia pozostaje widoczna podczas animacji.
        originalPage.style.visibility = "hidden";

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

        function finishAnimation() {

            turningSheet.stage.remove();

            isTurning = false;

            // Dopiero po animacji zmieniamy zawartość albumu.
            try {

                if (onComplete) {
                    onComplete();
                }

            } finally {

                // Przywracamy widoczność oryginalnej kartki.
                originalPage.style.visibility =
                    originalVisibility;

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

        if (button.matches("#album-frontmatter-next")) {
            return "next";
        }

        if (button.matches("#album-toc-return")) {
            return "previous";
        }

        if (button.matches("#album-pagination button")) {

            const text = button.textContent.trim();

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
       OBSŁUGA PRZEWRACANIA I ZMIANY STRON
       ===================================================== */

    document.addEventListener("click", function (event) {

        if (replayingClick) return;

        const target = event.target;

        if (!target || typeof target.closest !== "function") {
            return;
        }

        const button = target.closest(
            "#album-frontmatter-next, " +
            "#album-toc-return, " +
            "#album-pagination button"
        );

        const link = target.closest("[data-country-jump]");

        if (!button && !link) return;

        const direction = button
            ? getDirection(button)
            : "next";

        if (!direction) return;

        // Telefon działa bez animacji 3D.
        if (window.matchMedia("(max-width: 750px)").matches) {
            return;
        }

        // Blokujemy kolejne kliknięcia podczas animacji.
        if (isTurning) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }

        // Zmiana strony nastąpi dopiero po animacji.
        event.preventDefault();
        event.stopImmediatePropagation();

        const clickedElement = button || link;

        turnPage(direction, function () {

            replayingClick = true;

            try {
                clickedElement.click();
            } finally {
                replayingClick = false;
            }

        });

    }, true);


    console.log(
        "Album 3.0 — mechanizm przewracania kartek v4 załadowany"
    );

})();
