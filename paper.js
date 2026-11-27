
/* =========================================================
   ALBUM 3.0 — PAPER.JS
   Silnik animacji przewracania kartek
   ========================================================= */

(function () {
    "use strict";

    let isTurning = false;

    const ANIMATION_DURATION = 1400;
    const CLEANUP_DELAY = 250;

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

        if (direction === "next") {
            return spread.querySelector('[data-page-side="right"]');
        }

        return spread.querySelector('[data-page-side="left"]');
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

        const page = originalPage.cloneNode(true);

        removeCloneIds(page);

        page.inert = true;
        page.setAttribute("aria-hidden", "true");
        page.classList.add("paper-turning-page");

        page.style.position = "absolute";
        page.style.left = (pageRect.left - mainRect.left) + "px";
        page.style.top = (pageRect.top - mainRect.top) + "px";
        page.style.width = pageRect.width + "px";
        page.style.height = pageRect.height + "px";
        page.style.margin = "0";
        page.style.pointerEvents = "none";

        if (direction === "next") {
            page.style.transformOrigin = "left center";
            page.classList.add("paper-turn-next");
        } else {
            page.style.transformOrigin = "right center";
            page.classList.add("paper-turn-previous");
        }

        main.appendChild(page);

        // Przygotowanie początkowej pozycji kartki
        page.getBoundingClientRect();

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                page.classList.add("paper-turn-active");
            });
        });

        let finished = false;

        function cleanup() {
            if (finished) return;

            finished = true;

            page.remove();
            isTurning = false;
        }

        page.addEventListener("transitionend", function (event) {
            if (
                event.target === page &&
                event.propertyName === "transform"
            ) {
                window.setTimeout(cleanup, CLEANUP_DELAY);
            }
        });

        // Zabezpieczenie, gdyby przeglądarka nie zgłosiła transitionend
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

    // Obsługa przycisków nawigacji
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

    // Obsługa przejścia ze spisu treści do kraju
    document.addEventListener("click", function (event) {
        const link = event.target.closest("[data-country-jump]");

        if (!link) return;

        turnPage("next");
    }, true);

    console.log("Album 3.0 — paper.js załadowany");
})();
