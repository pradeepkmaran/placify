// Import Firebase auth and provider from firebase.js
import { auth, provider } from './firebase.js';
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const googleSignInButton = document.getElementById("googleSignInButton");
  
  googleSignInButton.addEventListener("click", () => {
    signInWithPopup(auth, provider)
      .then((data) => {
        localStorage.setItem("email", data.user.email);
        window.location.href = "/frontend/Home/home.html";
        // document.body.innerHTML += `<p>Signed in as: ${data.user.email}</p>`;
      })
      .catch((error) => {
        console.error("Error during sign in:", error);
      });
  });
});
