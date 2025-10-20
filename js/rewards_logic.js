// confetti reference: https://codepen.io/rewkun/pen/ExMeeBV


//AI (ChatGPT) has been used with this code, for the following purposes: 
// 1. to simplify the code and remove irrelevant code
// 2. to error-check or correct, or to give advice on where to check for problems
// 3. to add base comments to explain what I'm doing. 
// All base code is done by hand. AI changes have been changed and edited and have been used to improve, not to do the code itself. 

// wait for the class "progress-done" to load in the DOM
function waitForProgressBar(callback) {
  const checkExist = setInterval(() => {
    const progress = document.querySelector(".progress-done");
    if (progress) {
      clearInterval(checkExist);
      callback(progress);
    }
  }, 100); // checks every 100ms
}


waitForProgressBar((progress) => {
  console.log("Progress bar ready");

  // load saved points 
  const loggedInUser = localStorage.getItem('loggedInUser') || 'guest';
  const storageKey = `rewards_${loggedInUser}`;

  let userPoints = 0;
  let goal = 50;

  function loadSavedPoints() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.userPoints === 'number') userPoints = parsed.userPoints;
      if (typeof parsed.goal === 'number') goal = parsed.goal;
    } catch (e) {
      console.warn('Failed to load saved rewards:', e);
    }
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ userPoints, goal }));
    } catch (e) {
      console.warn('Failed to save rewards:', e);
    }
  }

  // load initially
  loadSavedPoints();

  // track previous points so we only celebrate when crossing the threshold
  let lastPoints = userPoints;

  // add confetti when goal is reached
  function launchConfetti() {
    try {
      const colors = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'];
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '20000';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      const dpi = window.devicePixelRatio || 1;
      function resize() {
        canvas.width = Math.floor(window.innerWidth * dpi);
        canvas.height = Math.floor(window.innerHeight * dpi);
        ctx.scale(dpi, dpi);
      }
      resize();
      window.addEventListener('resize', resize);

      const particles = [];
      const count = 120;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: -10 - Math.random() * 200,
          size: 6 + Math.random() * 8,
          rotation: Math.random() * 360,
          speedX: -150 + Math.random() * 300,
          speedY: 100 + Math.random() * 300,
          angularSpeed: -600 + Math.random() * 1200,
          color: colors[Math.floor(Math.random() * colors.length)],
          ttl: 3000 + Math.random() * 2000,
          age: 0
        });
      }

      let last = performance.now();
      function draw(now) {
        const dt = now - last;
        last = now;
        ctx.clearRect(0, 0, canvas.width / dpi, canvas.height / dpi);
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.age += dt;
          if (p.age > p.ttl) {
            particles.splice(i, 1);
            continue;
          }
          // simple physics
          const t = dt / 1000;
          p.x += p.speedX * t;
          p.y += p.speedY * t;
          // gravity
          p.speedY += 800 * t;
          p.rotation += p.angularSpeed * t;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
        if (particles.length > 0) requestAnimationFrame(draw);
        else {
          // cleanup
          window.removeEventListener('resize', resize);
          canvas.parentElement.removeChild(canvas);
        }
      }
      requestAnimationFrame(draw);
    } catch (e) {
      console.warn('Confetti failed:', e);
    }
  }

    // updates the progress bar visually and the text
  function updateProgressBar() {
    if (!goal || goal <= 0) return;
    if (userPoints < 0) userPoints = 0;

    const percentage = Math.min((userPoints / goal) * 100, 100);

    // styling of the progress fill
    function setFillWidth(fromZero = false) {
      if (fromZero) {

        progress.style.transition = 'none';
        progress.style.width = '0%';

        progress.getBoundingClientRect();

        requestAnimationFrame(() => {
          progress.style.transition = 'width 0.5s ease-in-out';
          progress.style.width = `${percentage}%`;
        });
      } else {
        progress.style.transition = 'width 0.5s ease-in-out';
        progress.style.width = `${percentage}%`;
      }
    }
  // always animate from zero -> percentage 
  setFillWidth(true);
    // move runner relative to the progress fill's parent container
    const runner = progress.parentElement.querySelector("#runner");
    if (runner) {
      // place the runner a few percent behind the fill edge
      const runnerPercentage = Math.max(percentage - 1, 0); // -1% behind the progress filler
      // always animate runner from 0 -> target position
      runner.style.transition = 'none';
      runner.style.left = `0%`;
      runner.getBoundingClientRect();
      requestAnimationFrame(() => {
        runner.style.transition = 'left 0.5s ease-in-out';
        runner.style.left = `${runnerPercentage}%`;
      });
    }
  }

  window.addPoints = function (amount) {
    userPoints += amount;
    console.log(`You gained ${amount} points! Total: ${userPoints}`);
    checkGoal();
    save();
    updateProgressBar();
  };

  window.setGoal = function (newGoal) {
    goal = newGoal;
    console.log(`New goal set: ${goal} points`);
    save();
    updateProgressBar();
  };

  window.resetPoints = function () {
    userPoints = 0;
    console.log("Points reset");
    save();
    updateProgressBar();
  };

  function checkGoal() {
    if (lastPoints < goal && userPoints >= goal) {
      console.log('Goal reached!');
      // celebrate
      launchConfetti();
    }
    // update lastPoints for future checks
    lastPoints = userPoints;
  }

  // linking html inputs

  const input = document.getElementById("inputValue"); //user points
  const maxInput = document.getElementById("inputMax"); //goal 

  if (input) {
    input.addEventListener("keyup", function () {
      userPoints = parseInt(input.value, 10) || 0;
      save();
      updateProgressBar();
    });
  }

  if (maxInput) {
    maxInput.addEventListener("keyup", function () {
      goal = parseInt(maxInput.value, 10) || 0;
      save();
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
