
/* =========================================================
   ALBUM 3.0 — PAPER.JS
   Realistyczne przewracanie kartek
   ========================================================= */

(function () {
    "use strict";

    let isTurning = false;

    const ANIMATION_DURATION = 1500;
    const CLEANUP_DELAY = 180;

    function getMain() {
        return document.querySelector(".album-v3-main");
    }

    function getVisibleSpread() {
        const frontmatter = document.getElementById("album-frontmatter");
        const spread = document.getElementById("album-spread");

        if (frontmatter && !frontmatter.hidden) {
            return frontmatter;
        }

        if (spread && !spread.hidden) {
            return spread;
        }

        return null;
    }

    function getTurningPage(direction) {
        const spread = getVisibleSpread();

        if (!spread) return null;

        return spread.querySelector(
            direction === "next"
                ? '[data-page-side="right"]'
                : '[data-page-side="left"]'
        );
    }

    function removeCloneIds(element) {
        element.removeAttribute("id");

        element.querySelectorAll("[id]").forEach(function (item) {
            item.removeAttribute("id");
        });
    }

    function turnPage(direction) {
        if (isTurning) return;

        const main = getMain();
        const originalPage = getTurningPage(direction);

        if (!main || !originalPage) return;

        const pageRect = originalPage.getBoundingClientRect();
        const mainRect = main.getBoundingClientRect();

        if (!pageRect.width || !pageRect.height) return;

        isTurning = true;

        // Zewnętrzna konstrukcja obracanej kartki
        const sheet = document.createElement("div");
        sheet.className = "paper-turn-sheet";

        sheet.style.left = (pageRect.left - mainRect.left) + "px";
        sheet.style.top = (pageRect.top - mainRect.top) + "px";
        sheet.style.width = pageRect.width + "px";
        sheet.style.height = pageRect.height + "px";

        // Przednia strona kartki — kopia aktualnej strony
        const front = originalPage.cloneNode(true);

        removeCloneIds(front);

        front.inert = true;
        front.setAttribute("aria-hidden", "true");
        front.classList.add("paper-turn-front");

        // Tylna strona kartki
        const back = document.createElement("div");
        back.className = "paper-turn-back";

        back.setAttribute("aria-hidden", "true");

        // Obie strony trafiają do obracanej kartki
        sheet.appendChild(front);
        sheet.appendChild(back);

        if (direction === "next") {
            sheet.classList.add("paper-turn-next");
        } else {
            sheet.classList.add("paper-turn-previous");
        }

        main.appendChild(sheet);

        // Przeliczenie początkowej pozycji
        sheet.getBoundingClientRect();

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                sheet.classList.add("paper-turn-active");
            });
        });

        let finished = false;

        function cleanup() {
            if (finished) return;

            finished = true;

            sheet.remove();
            isTurning = false;
        }

        sheet.addEventListener("transitionend", function (event) {
            if (
                event.target === sheet &&
                event.propertyName === "transform"
            ) {
                window.setTimeout(cleanup, CLEANUP_DELAY);
            }
        });

        // Awaryjne zakończenie animacji
        window.setTimeout(
            cleanup,
            ANIMATION_DURATION + CLEANUP_DELAY + 500
        );
    }

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

    // Nawigacja przyciskami
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

    // Przejście ze spisu treści do wybranego kraju
    document.addEventListener("click", function (event) {
        const link = event.target.closest("[data-country-jump]");

        if (!link) return;

        turnPage("next");
    }, true);

    console.log("Album 3.0 — realistyczny paper.js załadowany");
})();
