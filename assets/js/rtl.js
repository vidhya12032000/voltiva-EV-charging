"use strict";

const rtlToggle =
    document.getElementById("rtlToggle");

const savedDirection =
    localStorage.getItem(
        "chargenova-direction"
    );


if (savedDirection === "rtl") {

    document.documentElement.dir = "rtl";

}


rtlToggle?.addEventListener("click", () => {

    const isRTL =
        document.documentElement.dir === "rtl";

    if (isRTL) {

        document.documentElement.dir =
            "ltr";

        localStorage.setItem(
            "chargenova-direction",
            "ltr"
        );

    } else {

        document.documentElement.dir =
            "rtl";

        localStorage.setItem(
            "chargenova-direction",
            "rtl"
        );

    }

});