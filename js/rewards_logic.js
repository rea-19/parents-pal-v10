//AI (ChatGPT) has been used with this code, for the following purposes: 
// 1. to simplify the code and remove irrelevant code
// 2. to error-check or correct, or to give advice on where to check for problems
// 3. to add base comments to explain what I'm doing. 
// All base code is done by hand. AI changes have been changed and edited and have been used to improve, not to do the code itself. 


// WAIT UNTIL PROGRESS BAR EXISTS 
function waitForProgressBar(callback) {
  const checkExist = setInterval(() => {
    const progress = document.querySelector(".progress-done");
    if (progress) {
      clearInterval(checkExist);
      callback(progress);
    }
  }, 100); // checks every 100ms
}

// WHEN FOUND, INITIALIZE 
waitForProgressBar((progress) => {
  console.log("Progress bar ready");

  let userPoints = 0;
  let goal = 50;

  function updateProgressBar() {
    if (!goal || goal <= 0) return;
    if (userPoints < 0) userPoints = 0;

    const percentage = Math.min((userPoints / goal) * 100, 100);
    progress.style.width = `${percentage}%`;
    progress.innerText = `${userPoints}/${goal}`;
  }

  window.addPoints = function (amount) {
    userPoints += amount;
    console.log(`You gained ${amount} points! Total: ${userPoints}`);
    checkGoal();
    updateProgressBar();
  };

  window.setGoal = function (newGoal) {
    goal = newGoal;
    console.log(`New goal set: ${goal} points`);
    updateProgressBar();
  };

  window.resetPoints = function () {
    userPoints = 0;
    console.log("Points reset");
    updateProgressBar();
  };

  function checkGoal() {
    if (userPoints >= goal) {
      console.log("Goal reached!");
    }
  }

  const input = document.getElementById("inputValue");
  const maxInput = document.getElementById("inputMax");

  if (input) {
    input.addEventListener("keyup", function () {
      userPoints = parseInt(input.value, 10) || 0;
      updateProgressBar();
    });
  }

  if (maxInput) {
    maxInput.addEventListener("keyup", function () {
      goal = parseInt(maxInput.value, 10) || 0;
      updateProgressBar();
    });
  }

  // INITIALIZE
  updateProgressBar();
});

// Reference: https://www.bing.com/videos/riverview/relatedvideo?q=how+do+i+make+an+item+flip+js&&view=riverview&mmscn=mtsc&mid=F9EDC31DB5C106C22CCFF9EDC31DB5C106C22CCF&&aps=240&FORM=VMSOVR
// Membership card flipped
function flipCard() {
  const card = document.getElementById("membershipCard");
  card.classList.toggle("flipped");
}
