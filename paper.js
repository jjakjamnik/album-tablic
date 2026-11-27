
/* =========================================================
   ALBUM 3.0 — PAPER.JS
   Przewracanie kartek — nowy mechanizm
   ========================================================= */

(function () {
    "use strict";

    const ANIMATION_DURATION = 1500;
    const CLEANUP_DELAY = 120;

    let isTurning = false;
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

        front.classList.add("album-page-turn-face");
        front.classList.add("album-page-turn-front");

        front.inert = true;
        front.setAttribute("aria-hidden", "true");

        const back = document.createElement("div");

        back.className =
            "album-page-turn-face album-page-turn-back";

        back.setAttribute("aria-hidden", "true");

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
       ANIMACJA
       ===================================================== */

    function animateTurningSheet(turningSheet) {
        const sheet = turningSheet.sheet;

        const isNext = turningSheet.direction === "next";

        const startRotation = "rotateY(0deg)";
        const endRotation = isNext
            ? "rotateY(-180deg)"
            : "rotateY(180deg)";

        if (typeof sheet.animate !== "function") {
            turningSheet.stage.remove();
            isTurning = false;
            return;
        }

        const animation = sheet.animate(
            [
                {
                    transform: startRotation,
                    filter: "drop-shadow(0 2px 3px rgba(0,0,0,.12))"
                },
                {
                    offset: 0.35,
                    filter: "drop-shadow(0 8px 12px rgba(0,0,0,.22))"
                },
                {
                    offset: 0.65,
                    filter: "drop-shadow(0 10px 14px rgba(0,0,0,.26))"
                },
                {
                    transform: endRotation,
                    filter: "drop-shadow(0 3px 5px rgba(0,0,0,.12))"
                }
            ],
            {
                duration: ANIMATION_DURATION,
                easing: "cubic-bezier(.45,.05,.2,1)",
                fill: "forwards"
            }
        );

        animation.onfinish = function () {
            window.setTimeout(function () {
                turningSheet.stage.remove();
                isTurning = false;
            }, CLEANUP_DELAY);
        };

        animation.oncancel = function () {
            turningSheet.stage.remove();
            isTurning = false;
        };
    }


    /* =====================================================
       GŁÓWNA FUNKCJA PRZEWRACANIA
       ===================================================== */

    function turnPage(direction) {
        if (isTurning) return;

        const originalPage = getPageToTurn(direction);

        if (!originalPage) return;

        installAnimationStyles();

        const turningSheet =
            createTurningSheet(originalPage, direction);

        if (!turningSheet) return;

        isTurning = true;

        animateTurningSheet(turningSheet);
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
       OBSŁUGA PRZYCISKÓW
       ===================================================== */

    document.addEventListener("click", function (event) {
        const button = event.target.closest(
            "#album-frontmatter-next, " +
            "#album-toc-return, " +
            "#album-pagination button"
        );

        if (!button) return;

        const direction = getDirection(button);

        if (!direction) return;

        turnPage(direction);

    }, true);


    /* =====================================================
       OBSŁUGA SPISU TREŚCI
       ===================================================== */

    document.addEventListener("click", function (event) {
        const link = event.target.closest("[data-country-jump]");

        if (!link) return;

        turnPage("next");

    }, true);


    console.log(
        "Album 3.0 — nowy mechanizm przewracania kartek załadowany"
    );

})();
