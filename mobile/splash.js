/* =========================================================
   ALBUM TABLIC — EKRAN STARTOWY
   ========================================================= */

(function () {

    "use strict";


    let progress = 0;

    let progressTimer = null;


    function setProgress(value) {

        progress = Math.max(0, Math.min(100, value));

        const bar =
            document.getElementById("album-splash-progress-bar");

        const text =
            document.getElementById("album-splash-loading");

        if (bar) {

            bar.style.width = progress + "%";

        }

        if (text) {

            if (progress < 30) {

                text.textContent = "URUCHAMIANIE...";

            } else if (progress < 60) {

                text.textContent = "ŁĄCZENIE Z BAZĄ...";

            } else if (progress < 90) {

                text.textContent = "WCZYTYWANIE KOLEKCJI...";

            } else if (progress < 100) {

                text.textContent = "PRZYGOTOWYWANIE ALBUMU...";

            } else {

                text.textContent = "GOTOWE";

            }

        }

    }


    function startProgress() {

        setProgress(5);


        progressTimer = setInterval(function () {

            /*
             * Pasek dochodzi tylko do 90%.
             * Ostatnie 10% zostawiamy na faktyczne
             * zakończenie ładowania albumu.
             */

            if (progress < 90) {

                let step;

                if (progress < 30) {

                    step = 4;

                } else if (progress < 60) {

                    step = 3;

                } else {

                    step = 1;

                }

                setProgress(progress + step);

            }

        }, 120);

    }


    function finishSplash() {

        if (progressTimer) {

            clearInterval(progressTimer);

            progressTimer = null;

        }


        setProgress(100);


        setTimeout(function () {

            const splash =
                document.getElementById("album-splash");

            if (splash) {

                splash.classList.add("splash-hidden");

            }

        }, 350);

    }


    /*
     * Udostępniamy funkcję globalnie.
     *
     * script.js wywoła:
     *
     * window.albumSplashReady();
     *
     * kiedy album zostanie już załadowany.
     */

    window.albumSplashReady = finishSplash;


    document.addEventListener("DOMContentLoaded", function () {

        startProgress();

    });


})();