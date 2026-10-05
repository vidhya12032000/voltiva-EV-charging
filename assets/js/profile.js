/* =========================================================
   NESTORA LOGIN PAGE
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

const passwordToggle =
    document.getElementById("passwordToggle");

const forgotPassword =
    document.getElementById("forgotPassword");

const googleBtn =
    document.getElementById("googleBtn");

const loginBtn =
    document.getElementById("loginBtn");

const formMessage =
    document.getElementById("formMessage");

const themeBtn =
    document.getElementById("themeBtn");

const rememberCheckbox =
    document.getElementById("remember");


/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

passwordToggle.addEventListener("click", () => {

    const isPassword =
        passwordInput.type === "password";

    passwordInput.type =
        isPassword ? "text" : "password";

    passwordToggle.innerHTML =
        isPassword
            ? '<i class="fa-regular fa-eye-slash"></i>'
            : '<i class="fa-regular fa-eye"></i>';

});


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function validateEmail(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);

}


/* =========================================================
   CLEAR ERRORS
========================================================= */

function clearErrors() {

    emailError.textContent = "";
    passwordError.textContent = "";

    formMessage.textContent = "";
    formMessage.className = "form-message";

}


/* =========================================================
   LOGIN VALIDATION
========================================================= */

function validateForm() {

    let isValid = true;

    clearErrors();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value.trim();


    /* Email */

    if (!email) {

        emailError.textContent =
            "Please enter your email address.";

        isValid = false;

    }
    else if (!validateEmail(email)) {

        emailError.textContent =
            "Please enter a valid email address.";

        isValid = false;

    }


    /* Password */

    if (!password) {

        passwordError.textContent =
            "Please enter your password.";

        isValid = false;

    }
    else if (password.length < 6) {

        passwordError.textContent =
            "Password must contain at least 6 characters.";

        isValid = false;

    }


    return isValid;
}


/* =========================================================
   LOGIN SUBMIT
========================================================= */

loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    if (!validateForm()) {
        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value.trim();


    /* Loading */

    loginBtn.disabled = true;

    loginBtn.classList.add("loading");

    document.getElementById("loginText")
        .textContent = "Signing in...";


    /*
       Simulating API request.
       Later this will be replaced with:

       fetch("/api/login", {
           method: "POST",
           body: JSON.stringify({
               email,
               password
           })
       })
    */

    setTimeout(() => {

        /*
           Demo credentials

           Email:
           demo@nestora.com

           Password:
           123456
        */

        if (
            email === "demo@nestora.com" &&
            password === "123456"
        ) {

            formMessage.textContent =
                "Login successful! Redirecting...";

            formMessage.classList.add("success");


            /* Remember email */

            if (rememberCheckbox.checked) {

                localStorage.setItem(
                    "nestoraRememberedEmail",
                    email
                );

            }
            else {

                localStorage.removeItem(
                    "nestoraRememberedEmail"
                );

            }


            /*
               Future dashboard redirect:

               window.location.href =
                   "dashboard.html";
            */

        }
        else {

            formMessage.textContent =
                "Invalid email or password.";

            formMessage.classList.add("error");

            loginBtn.disabled = false;

            loginBtn.classList.remove("loading");

            document.getElementById("loginText")
                .textContent = "Sign in";
        }

    }, 1200);

});


/* =========================================================
   REMEMBERED EMAIL
========================================================= */

const rememberedEmail =
    localStorage.getItem(
        "nestoraRememberedEmail"
    );

if (rememberedEmail) {

    emailInput.value =
        rememberedEmail;

    rememberCheckbox.checked =
        true;
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

forgotPassword.addEventListener("click", (event) => {

    event.preventDefault();

    const email =
        emailInput.value.trim();

    if (!email) {

        emailError.textContent =
            "Enter your email first to reset your password.";

        emailInput.focus();

        return;
    }

    if (!validateEmail(email)) {

        emailError.textContent =
            "Please enter a valid email address.";

        emailInput.focus();

        return;
    }

    formMessage.textContent =
        "Password reset link would be sent to your email.";

    formMessage.className =
        "form-message success";

});


/* =========================================================
   GOOGLE LOGIN
========================================================= */

googleBtn.addEventListener("click", () => {

    formMessage.textContent =
        "Google authentication will be connected later.";

    formMessage.className =
        "form-message";

});


/* =========================================================
   THEME TOGGLE
========================================================= */

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const isDark =
        document.body.classList.contains("dark");

    themeBtn.innerHTML =
        isDark
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';

    localStorage.setItem(
        "nestoraTheme",
        isDark ? "dark" : "light"
    );

});


/* =========================================================
   LOAD SAVED THEME
========================================================= */

const savedTheme =
    localStorage.getItem("nestoraTheme");

if (savedTheme === "dark") {

    document.body.classList.add("dark");

    themeBtn.innerHTML =
        '<i class="fa-solid fa-sun"></i>';

}