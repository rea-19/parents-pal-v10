document.addEventListener("DOMContentLoaded", () => {
  //Select all FAQ buttons
  const faqButtons = document.querySelectorAll(".faq-question");

  faqButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("aria-controls");
      const targetAnswer = document.getElementById(targetId);
      const isAlreadyOpen = button.getAttribute("aria-expanded") === "true";

      //Close answers that is clicked
      faqButtons.forEach(btn => {
        const answerId = btn.getAttribute("aria-controls");
        const answer = document.getElementById(answerId);
        btn.setAttribute("aria-expanded", "false");
        answer.hidden = true;
      });

      //if the FAQ button is not open, open the clicked one 
      if (!isAlreadyOpen) {
        button.setAttribute("aria-expanded", "true");
        targetAnswer.hidden = false;
      }
    });
  });
});
