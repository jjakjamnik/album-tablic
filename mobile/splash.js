/* =========================================================
   ALBUM TABLIC — EKRAN STARTOWY
   ========================================================= */

(function () {

    "use strict";


    /*
     * Splash ma pojawić się tylko przy pierwszym
     * uruchomieniu aplikacji w danej sesji.
     */

    const SPLASH_SESSION_KEY = "albumSplashShown";


    function setProgress(value) {

        const progress =
            Math.max(0, Math.min(100, value));

        const bar =
            document.getElementById(
                "album-splash-progress-bar"
            );

        const text =
            document.getElementById(
                "album-splash-loading"
            );


        if (bar) {

            bar.style.width =
                progress + "%";

        }


        if (text) {

            if (progress < 30) {

                text.textContent =
                    "URUCHAMIANIE...";

            } else if (progress < 60) {

                text.textContent =
                    "ŁĄCZENIE Z BAZĄ...";

            } else if (progress < 90) {

                text.textContent =
                    "WCZYTYWANIE KOLEKCJI...";

            } else if (progress < 100) {

                text.textContent =
                    "PRZYGOTOWYWANIE ALBUMU...";

            } else {

                text.textContent =
                    "GOTOWE";

            }

        }

    }


    let progress = 0;
    let progressTimer = null;


    function startProgress() {

        setProgress(5);


        progressTimer = setInterval(function () {

            if (progress < 90) {

                let step;


                if (progress < 30) {

                    step = 4;

                } else if (progress < 60) {

                    step = 3;

                } else {

                    step = 1;

                }


                progress += step;

                setProgress(progress);

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
                document.getElementById(
                    "album-splash"
                );


            if (splash) {

                splash.classList.add(
                    "splash-hidden"
                );

            }


            /*
             * Zapamiętujemy, że splash został
             * już pokazany w tej sesji.
             */

            try {

                sessionStorage.setItem(
                    SPLASH_SESSION_KEY,
                    "true"
                );

            } catch (error) {

                console.warn(
                    "Nie można zapisać sesji splash.",
                    error
                );

            }

        }, 350);

    }


    window.albumSplashReady =
        finishSplash;


    document.addEventListener(
        "DOMContentLoaded",
        function () {

            let alreadyShown = false;


            try {

                alreadyShown =
                    sessionStorage.getItem(
                        SPLASH_SESSION_KEY
                    ) === "true";

            } catch (error) {

                alreadyShown = false;

            }


            /*
             * Jeśli splash był już pokazany,
             * chowamy go natychmiast.
             */

            if (alreadyShown) {

                const splash =
                    document.getElementById(
                        "album-splash"
                    );


                if (splash) {

                    splash.classList.add(
                        "splash-hidden"
                    );

                }


                return;

            }


            startProgress();

        }

    );

})();
