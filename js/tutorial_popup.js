document.addEventListener("DOMContentLoaded", () => {

  // Wait 5 seconds before showing popup
  setTimeout(() => {

    // --- CREATE THE POPUP ---
    const tutorialPopup = document.createElement("div");
    tutorialPopup.id = "tutorial-popup";

    tutorialPopup.innerHTML = `
      <div id="tutorial-content">
        <div id="triangle">&#9654;</div>
      </div>
    `;

    // Append to body
    document.body.appendChild(tutorialPopup);

    // --- CLICK HANDLER: go to resources_guide.html ---
    tutorialPopup.addEventListener("click", () => {
      window.location.href = "/html/resources_guide.html";
    });

    // --- AUTO-HIDE AFTER 10 SECONDS ---
    setTimeout(() => {
      tutorialPopup.style.opacity = "0";
      setTimeout(() => tutorialPopup.remove(), 500); // fade out then remove
    }, 10000);

  }, 5000); // 5000ms = 5 seconds

});
