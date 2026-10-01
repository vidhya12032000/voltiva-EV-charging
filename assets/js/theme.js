"use strict";

const themeToggle =
    document.getElementById("themeToggle");

const savedTheme =
    localStorage.getItem("chargenova-theme");


if (savedTheme === "light") {

    document.body.classList.add(
        "light-theme"
    );

}


function updateThemeIcon() {

    const icon =
        themeToggle?.querySelector("i");

    if (!icon) return;

    if (
        document.body.classList.contains(
            "light-theme"
        )
    ) {

        icon.className =
            "ri-sun-line";

    } else {

        icon.className =
            "ri-moon-line";

    }

}


updateThemeIcon();


themeToggle?.addEventListener("click", () => {

    document.body.classList.toggle(
        "light-theme"
    );

    const isLight =
        document.body.classList.contains(
            "light-theme"
        );

    localStorage.setItem(
        "chargenova-theme",
        isLight ? "light" : "dark"
    );

    updateThemeIcon();

});