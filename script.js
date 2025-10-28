import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === CONSTANTS & CONFIGURATIONS ===
const SUPABASE_URL = 'https://gkfrlvfaersfknteuqwf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZnJsdmZhZXJzZmtudGV1cXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODE5ODIsImV4cCI6MjA3MzQ1Nzk4Mn0.qnqj1sIT2hAcH2MOQawcbmKxq1iY_kaRZrSM_mLpgKc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const COOKIE_EXPIRY = 30; // days
const HISTORY_KEY = 'clickHistory';
const MAX_HISTORY = 50; // maximum number of history entries to store
const LEADERBOARD_SIZE = 10; // Number of top scores to display
const COOKIE_OPTIONS = {
    expires: COOKIE_EXPIRY,
    path: '/',
    sameSite: 'strict'
};

// === STATE VARIABLES ===
const body = document.querySelector('body');
let logined = false;
let alreadyInited = false;
let btn_clicked = false;
let just_clicked = false;
let timeout = null;
let timerInterval = null;
let start = null;
let lastElapsed = null;

// === MESSAGE ARRAYS ===
const onHoverList = [
    "Hey!",
    "<i>Uh oh...</i>",
    "<b>WHAT ARE YOU THINKING???</b>",
    "You'll surely regret what's <i>coming...</i>",
    "You're making a <b>MISTAKE!!!</b>"
];

const onClickList = [
    "<b>NO!!!!!!! 😭</b>",
    "<i>Shoot...</i>",
    "<b>HOW DO YOU DID <i>THAT???</i> 😱</b>",
    "<i>*cries in horror*</i>",
    "<b>%*@&$%!&@!!!!!!! 🤯</b>"
];

const dramaticMsgs = [
    "<b><i>THE BUTTON HAS BEEN VIOLATED!</i></b>",
    "<b><i>YOU JUST UNLEASHED THE UNTHINKABLE!</i></b>",
    "<b><i>THE SACRED CLICK HAS BEEN MADE... CONSEQUENCES WILL FOLLOW.</i></b>",
    "<b><i>REALITY IS COLLAPSING. NICE JOB.</i></b>",
    "<b><i>THE LEGENDS WARNED US ABOUT THIS DAY.</i></b>",
    "<b><i>YOU'VE AWAKENED THE BUTTON'S WRATH!</i></b>",
    "<b><i>THE SYSTEM IS SHOOK. THE BUTTON IS BETRAYED.</i></b>",
    "<b><i>YOU CLICKED. THE COSMOS BLINKED.</i></b>",
    "<b><i>THE BUTTON CRIED OUT IN AGONY!</i></b>",
    "<b><i>YOU HAVE SUMMONED THE FINAL PROTOCOL.</i></b>",
    "<b><i>THE CLICK ECHOES THROUGH TIME.</i></b>",
    "<b><i>THE BUTTON HAS BEEN DEFILED. REPENT.</i></b>",
    "<b><i>THE UNIVERSE JUST FILED A COMPLAINT.</i></b>",
    "<b><i>YOU BROKE THE UNWRITTEN RULE.</i></b>",
    "<b><i>THE BUTTON IS DISAPPOINTED IN YOU.</i></b>",
    "<b><i>THE CLICK... IT WASN’T SUPPOSED TO HAPPEN.</i></b>",
    "<b><i>YOU’VE TRIGGERED THE APOCALYPSE SEQUENCE.</i></b>",
    "<b><i>THE BUTTON HAS ENTERED EMERGENCY MODE.</i></b>",
    "<b><i>YOU’VE BEEN LOGGED... FOR ETERNAL JUDGMENT.</i></b>",
    "<b><i>THE CLICK HAS BEEN RECORDED IN THE BOOK OF SHAME.</i></b>"
];

const alertMsgs = [
    "Told Ya!",
    "Too Slow!",
    "Ha Ha!",
    "Gotcha!",
    "CAUGHT YOU TRYING TO PRESS THAT BUTTON",
    "Nice reflexes... still not enough.",
    "You missed. Again.",
    "This button is faster than you.",
    "Try harder, human.",
    "You clicked nothing. Congrats.",
    "The button dodged you.",
    "You blinked, didn’t you?",
    "Almost... but nope.",
    "This button has trust issues.",
    "You activated disappointment.",
    "Your click has been denied.",
    "You pressed air.",
    "The button laughed at you.",
    "You’ve been juked.",
    "This is a trap. You fell for it.",
    "You clicked. The button vanished.",
    "You vs. Button: 0–1",
    "Better luck next click.",
    "You summoned sarcasm.",
    "This button is a ninja.",
    "You touched the void.",
    "Denied by design.",
    "The button says: 'Not today.'",
    "You clicked. Reality disagreed.",
    "You’ve been click-blocked.",
    "You clicked... and nothing happened. Just like your dreams."
];

// === AUTH FUNCTIONS ===
async function post_login(loginSession) {
    const user = loginSession.user;
    const login_google = document.querySelector("#login-google");
    const highscore_p = document.querySelector("#highScore");
    const avatarDiv = document.querySelector("#avatar-container");

    // update/create userdata
    const { error: upsertError } = await supabase.from('clickers').upsert({
        id: user.id,
        email: user.email,
        username: user.user_metadata.name,
        avatar_url : user.user_metadata.picture,
        last_login: new Date().toISOString()
    });
    if (upsertError) console.log("catch an error!", upsertError);
    const { data, error } = await supabase
    .from('clickers')           // your table name
    .select('*')                // or specific fields like 'name, click_score'
    .eq('id', user.id)          // match by Supabase UUID
    .single();                  // return just one row

    // console log debugging
    console.log("fetched data: ", data);

    // Clear any existing avatar first
    const existingAvatar = avatarDiv.querySelector('#avatar');
    if (existingAvatar) {
        existingAvatar.remove();
    }

    // avatar setup
    const avatarNode = document.createElement("img");
    avatarNode.src = user.user_metadata.picture;
    avatarNode.alt = "User Avatar";
    avatarNode.id = "avatar"

    avatarDiv.appendChild(avatarNode);

    // Setup highscore
    window.userHistory = data.history;
    const bestScore = getBestScoreForTimeout(window.userHistory, timeout);
    highscore_p.innerHTML = `<strong>Best Score:</strong><br>${bestScore}`;

    // Create high score container div
    const highScoreContainer = document.createElement('div');
    highScoreContainer.style.display = 'flex';
    highScoreContainer.style.alignItems = 'center';
    highScoreContainer.style.gap = '8px';
    highScoreContainer.style.margin = '30px';
    highScoreContainer.style.height = '30px';

    highScoreContainer.appendChild(highscore_p);
    
    // Create clear button
    const clearHighScoreBtn = document.createElement('button');
    clearHighScoreBtn.id = 'clear-highscore';
    clearHighScoreBtn.textContent = '🗑️';
    clearHighScoreBtn.title = 'Clear High Score';
    clearHighScoreBtn.onclick = async () => {
        if (confirm('Are you sure you want to clear your high score?')) {
            try {
                const { error } = await supabase
                    .from('clickers')
                    .update({ high_score: null })
                    .eq('id', loginSession.user.id);

                if (error) throw error;

                highscore_p.innerHTML = '<strong>Best Score:</strong><br>None';
                console.log('✅ High score cleared successfully');
            } catch (error) {
                console.error('❌ Error clearing high score:', error);
            }
        }
    };
    
    // Add clear button to container
    highScoreContainer.appendChild(clearHighScoreBtn);
    
    // Add container to account div
    document.querySelector(".bottom-zone").appendChild(highScoreContainer);

    // Show avatar container and highscore
    avatarDiv.style.display = "block";
    if (highscore_p) {
        highscore_p.style.display = "block";
    }

    // signout logic
    login_google.innerHTML = "Sign Out ᳄";
    login_google.addEventListener("click", signout)
}

function signout() {
    const login_google = document.querySelector("#login-google");
    login_google.onclick = async () => {
        await supabase.auth.signOut();
        logined = false;
        
        // Reset login button to original state
        login_google.innerHTML = `Login with Google <img src="images/ico-google.png" id="google-ico">`;
        
        // Clear and hide avatar
        const avatarContainer = document.querySelector("#avatar-container");
        while (avatarContainer.firstChild) {
            avatarContainer.firstChild.remove();
        }
        avatarContainer.style.display = "none";
        
        // Clear and hide highscore
        const highscore = document.querySelector("#highScore");
        if (highscore) {
            highscore.textContent = "";
        }
        
        // hide clear highscore button
        document.getElementById('clear-highscore').style.display = 'none';
        // Restore login functionality
        login_google.addEventListener('click', () => {
            const loginUrl = `https://gkfrlvfaersfknteuqwf.supabase.co/auth/v1/authorize?provider=google`;
            if (!logined) window.open(loginUrl, "_blank");
        });
    }
}

// === GAME CORE FUNCTIONS ===
function block() {
    if (!timeout) return;

    document.getElementById("header").innerHTML = onHoverList[Math.floor(Math.random() * onHoverList.length)];

    start = performance.now(); // <-- Store start time
    const display = document.getElementById("timer");

    stopTimer();

    timerInterval = setInterval(() => {
        let now = performance.now();
        let elapsed = Math.floor(now - start);
        lastElapsed = elapsed;

        display.textContent = `${elapsed}ms / ${timeout}ms`;

        const alertMsg = alertMsgs[Math.floor(Math.random() * alertMsgs.length)];
        if (elapsed >= timeout) {
            stopTimer();
            if (!btn_clicked) alert(alertMsg);
        }
    }, 10);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    if (just_clicked) {
        just_clicked = false;
        return;
    }
}

function clearTimerOnMouseLeave() {
    if (!btn_clicked) {
        stopTimer();
        document.getElementById("timer").textContent = "";
        // Only reset header if button hasn't been clicked
        document.getElementById("header").innerHTML = "Betcha can't click the button!";
    }
}

async function after_click() {
    // 🎯 Update header with random message
    const header = document.getElementById("header");
    if (onClickList.length > 0 && header) {
        header.innerHTML = onClickList[Math.floor(Math.random() * onClickList.length)];
    }

    // 🧹 Clear previous dynamic messages and reset buttons
    document.querySelectorAll('.dynamic-msg')?.forEach(el => el.remove());
    document.querySelectorAll('.reset-btn')?.forEach(el => el.remove());

    // ✅ Reset state
    btn_clicked = true;
    just_clicked = true;
    stopTimer();

    // 🧱 Get main content container
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) {
        console.error("Main content container not found.");
        return;
    }

    // 🎭 Create dramatic message
    if (dramaticMsgs.length > 0) {
        const msg = document.createElement('p');
        msg.className = "dynamic-msg";
        const dramaticMsg = dramaticMsgs[Math.floor(Math.random() * dramaticMsgs.length)];
        const { data: { session }, error } = await supabase.auth.getSession();
        msg.innerHTML = `<b><i>WHAT????????? YOU ACTUALLY CLICKED ON THAT BUTTON?</i></b><br>`;

        if (error || !session) {
            msg.innerHTML += dramaticMsg;
        } else {
            const username = session?.user?.user_metadata?.name;
            if (!username) console.error('AFTER_CLICK() USERNAME ERROR: SESSION?.USER?.USER_METADATA?.NAME');

            let ranchoice = Math.random();
            if (ranchoice < 0.5) {
                msg.innerHTML += dramaticMsg.replace(
                    /<b><i>(.*?)<\/i><\/b>/,
                    `<b><i>${username.toUpperCase()}, $1</i></b>`
                );
            } else {
                msg.innerHTML += dramaticMsg.replace(
                    /([.!])<\/i><\/b>$/,
                    `, ${username.toUpperCase()}!</i></b>`
                );
            }
        }

        mainContent.appendChild(msg);
    }

    // 🕒 Show score
    const scoreStr = `${lastElapsed}/${timeout}`;
    const score = document.createElement('p');
    score.className = "dynamic-msg";
    score.innerHTML = `<span style="color:yellow">Your score: <b>${scoreStr}</b></span>`;
    mainContent.appendChild(score);

    // 🔁 Add reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = "Reset";
    resetBtn.className = "reset-btn";
    resetBtn.onclick = reset;
    mainContent.appendChild(resetBtn);

    // 📝 Save score to history
    saveScore(lastElapsed, timeout);
    console.log(`📝 Saved score to history: ${scoreStr}`);

    // 🔐 Record score as relic if logged in
    if (logined) {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                console.error("❌ Session error or no active session:", sessionError);
                return;
            }

            const user = session.user;
            const userId = user?.id;
            const username = user?.user_metadata?.name;
            if (!username) {
                username = await generateUniqueAnonymousName();
            }
            const avatar = user?.user_metadata?.picture || null;

            const currentRatio = lastElapsed / timeout;
            const rank = getRank(currentRatio);
            const relic = `${Date.now()}|${scoreStr}|${rank}|${currentRatio.toFixed(4)}`;

            const { data: userData, error: userError } = await supabase
                .from('leaderboard')
                .select('scores')
                .eq('id', userId)
                .single();

            if (userError || !userData) {
                console.warn("⚠️ Could not fetch user data for score logging.");
                return;
            }

            const scores = Array.isArray(userData.scores) ? userData.scores : [];
            const updatedScores = [...scores, relic];

            const { error: updateError } = await supabase
                .from('leaderboard')
                .update({ scores: updatedScores })
                .eq('id', userId);

            if (updateError) {
                console.error("❌ Score update error:", updateError);
            } else {
                window.userScores = updatedScores;
                console.log("📜 Relic score logged:", relic);
            }

        } catch (error) {
            console.error("❌ Error recording relic score:", error);
        }
    }

    // 🧊 Cooldown
    setTimeout(() => {
        btn_clicked = false;
    }, 1000);
}

// === UTILITY FUNCTIONS ===
async function generateUniqueAnonymousName() {
  let name;
  let attempts = 0;

  while (attempts < 10) {
    const suffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    name = `Anonymous${suffix}`;

    const { data, error } = await supabase
      .from('clickers')
      .select('username')
      .eq('username', name)
      .single();

    if (error || !data) {
      return name; // name is unique
    }

    attempts++;
  }

  console.warn("⚠️ Could not find unique anonymous name after 10 tries.");
  return `Anonymous${Date.now()}`; // fallback
}

function dark_mode() {
  const darkModeCheckbox = document.getElementById('dark-mode');
  const isDark = darkModeCheckbox?.checked;

  body.style.backgroundColor = isDark ? "#222" : "#ddd";
  body.style.color = isDark ? "#f5f5f5" : "#222";

  const accountDiv = document.getElementById('main-div');
  const label = document.querySelector('#utility label');
  const scoreText = document.querySelector('.dynamic-msg span');

  if (accountDiv) {
    accountDiv.style.backgroundColor = isDark ? "#222" : "#eee";
    accountDiv.style.borderColor = isDark ? "#888" : "#aaa";
  }

  if (label) {
    label.style.color = isDark ? "#f5f5f5" : "#222";
  }

  if (scoreText) {
    scoreText.style.color = isDark ? "yellow" : "#003366";
  }

  document.querySelectorAll("hr").forEach(hr => {
    hr.style.borderTopColor = isDark ? "#f5f5f5" : "#222";
  });

  const modeToggle = document.querySelector('.mode-toggle');
    if (modeToggle) {
        modeToggle.style.color = isDark ? "#f5f5f5" : "#222";
        modeToggle.style.backgroundColor = isDark ? "#222" : "#fff";
        modeToggle.style.border = isDark ? "1px solid white" : "1px solid black";
        modeToggle.style.borderRadius = "6px";
        modeToggle.style.padding = "6px";
    }

    if (darkModeCheckbox) {
        darkModeCheckbox.style.accentColor = isDark ? "#f5f5f5" : "#222";
    }
}

function ask_timeout(firstCall=false) {
    const timeoutDiv = document.getElementById('timeout');
    const submitTimeout = document.getElementById('submitTimeout');
    const inputTimeout = document.getElementById('timeoutChoice');
    const invalidTimeout = document.getElementById('invalidTimeout');
    timeoutDiv.style.display = 'inline-block'; // now it's visible
    let timeout = null;

    // hook a listener on submitTimeout
    submitTimeout.addEventListener('click', () => {
        choice = inputTimeout.value;
        if (/^[0-9]$/.test(choice)) {
            // valid input
            choice = String(choice);
            timeout = (choice * 100);
            // done with it! hiding #timeout
            timeoutDiv.style.display = 'none';
        } else {
            // invalid input
            invalidTimeout.style.display = 'inline-block'; // reveal error message!
        }
    })

    
    // null check first
    if (!timeout) {
        invalidTimeout.style.display = 'inline-block'; // reveal error message!
    }
    
    if (firstCall) {
        // maincontent is not up yet...
        const everything = document.getElementById('everything');
        everything.style.display = 'inline-block';
        // now it's up
    }

    // hide div
    timeoutDiv.style.display = 'none';

    // teleport
    document.getElementById('teleportation').innerHTML = `P.S. You have <strong>${timeout}ms</strong> before the alert fires.`

    const highscore_p = document.querySelector("#highScore");
    const bestScore = getBestScoreForTimeout(window.userHistory, timeout);
    highscore_p.innerHTML = `<strong>Best Score:</strong><br>${bestScore}`;

}

async function getRank(currentRatio) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('scores');

    if (error || !data) {
      console.error("❌ Error fetching leaderboard data:", error);
      return "Unknown";
    }

    // Flatten all scores from all users
    const allRatios = data
      .flatMap(entry => entry.scores || [])
      .map(scoreStr => {
        const parts = scoreStr.split('|');
        const ratio = parseFloat(parts[3]);
        return isNaN(ratio) ? null : ratio;
      })
      .filter(r => r !== null);

    // Sort ascending (lower ratio = better)
    allRatios.sort((a, b) => a - b);

    // Find rank (1-based index)
    const rank = allRatios.findIndex(r => currentRatio <= r) + 1;
    return rank > 0 ? rank : allRatios.length + 1;

  } catch (err) {
    console.error("❌ getRank() error:", err);
    return "Unknown";
  }
}

function reset() {
    btn_clicked = false;
    document.getElementById("header").innerHTML = "Betcha can't click the button!";
    
    // Only remove dynamic messages
    document.querySelectorAll('.dynamic-msg').forEach(el => el.remove());
    
    // Only remove reset buttons, not utility buttons
    document.querySelectorAll('.reset-btn').forEach(el => el.remove());
    
    // Re-add event listeners if needed
    const leaderboardButton = document.getElementById('leaderboard');
    const historyButton = document.getElementById('history-button');
    
    if (leaderboardButton) {
        leaderboardButton.addEventListener('click', showLeaderboard);
    }
    
    if (historyButton) {
        historyButton.addEventListener('click', showHistory);
    }
}

// Cookie utility functions
function setCookie(name, value, days = COOKIE_EXPIRY) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function saveScore(score, timeout) {
    // Save to localStorage history
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const entry = {
        score,
        timeout,
        timestamp: new Date().toISOString(),
        ratio: (score / timeout).toFixed(3)
    };
    
    history.unshift(entry);
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // Set cookie for latest score
    setCookie('lastScore', `${score}/${timeout}`);
}

function getBestScoreForTimeout(historyArray, currentTimeout) {
    if (!Array.isArray(historyArray)) return 'None';
    const filtered = historyArray
        .map(entry => {
            const [score, timeout] = entry.split('/').map(Number);
            return { score, timeout, ratio: score / timeout };
        })
        .filter(entry => entry.timeout === currentTimeout);

    if (filtered.length === 0) return 'None';

    const best = filtered.reduce((a, b) => (a.ratio < b.ratio ? a : b));
    return `${best.score}/${best.timeout}`;
}

async function showHistory() {
    const rawScores = window.userScores || JSON.parse(localStorage.getItem('score_log') || '[]');

    const parsed = rawScores.map(entry => {
        const [ts, scoreStr, rank, ratio] = entry.split('|');
        const [score, timeout] = scoreStr.split('/').map(Number);
        return {
            timestamp: Number(ts),
            score,
            timeout,
            ratio: parseFloat(ratio),
            rank
        };
    });

    const uniqueTimeouts = [...new Set(parsed.map(entry => entry.timeout))].sort((a, b) => a - b);

    const existingHistory = document.getElementById('history-container');
    if (existingHistory) existingHistory.remove();

    const historyContainer = document.createElement('div');
    historyContainer.id = 'history-container';
    historyContainer.innerHTML = `
        <div class="history-modal">
            <h2>📜 Your History 📜</h2>
            <div class="timeout-filter" id="topbar">
                <button class="timeout-btn active" data-timeout="all">All</button>
                ${uniqueTimeouts.map(t =>
                    `<button class="timeout-btn" data-timeout="${t}">${t}ms</button>`
                ).join('')}
            </div>
            <div class="history-content">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Score</th>
                            <th>Timeout</th>
                            <th>Ratio</th>
                            <th>Rank</th>
                        </tr>
                    </thead>
                    <tbody id="history-body">
                        ${generateHistoryRows(parsed)}
                    </tbody>
                </table>
            </div>
            <div class="history-actions">
                <button id="close-history">Close</button>
                <button id="clear-history">Clear History</button>
            </div>
        </div>
    `;

    document.body.appendChild(historyContainer);
    const topbar = document.getElementById('topbar');
    topbar.style.display = parsed.length === 0 ? "none" : "block";

    const filterButtons = document.querySelectorAll('.timeout-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const timeout = btn.dataset.timeout;
            const filtered = timeout === 'all'
                ? parsed
                : parsed.filter(entry => entry.timeout === parseInt(timeout));

            const tbody = document.getElementById('history-body');
            tbody.innerHTML = generateHistoryRows(filtered);
        });
    });

    document.getElementById('close-history').addEventListener('click', () => {
        historyContainer.remove();
    });

    document.getElementById('clear-history').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your history?')) {
            localStorage.removeItem('score_log');
            window.userScores = [];
            historyContainer.remove();
            showHistory();
        }
    });
}

function generateHistoryRows(history) {
    if (history.length === 0) {
        return '<tr><td colspan="5">No history available</td></tr>';
    }

    return history
        .sort((a, b) => a.timeout - b.timeout || a.ratio - b.ratio)
        .map(entry => `
            <tr>
                <td>${new Date(entry.timestamp).toLocaleString()}</td>
                <td>${entry.score}ms</td>
                <td>${entry.timeout}ms</td>
                <td>${entry.ratio}</td>
                <td>${entry.rank}</td>
            </tr>
        `).join('');
}


// === LEADERBOARD FUNCTIONS ===
async function showLeaderboard() {
    // Remove existing leaderboard
    const existingLeaderboard = document.getElementById('leaderboard-container');
    if (existingLeaderboard) {
        existingLeaderboard.remove();
    }

    // Create container with a wrapper function for the close action
    const closeLeaderboard = () => {
        const container = document.getElementById('leaderboard-container');
        if (container) container.remove();
    };

    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.id = 'leaderboard-container';
    leaderboardContainer.innerHTML = `
        <div class="leaderboard-modal">
            <h2>🏆 Top Players 🏆</h2>
            <div id="leaderboardTopbar" class="leaderboard-topbar"></div>
            <div id="leaderboardContent" class="leaderboard-content"></div>
            <button id="close-leaderboard" class="close-btn">✖</button>
        </div>
    `;

    document.body.appendChild(leaderboardContainer);

    document.getElementById('close-leaderboard').onclick = () => {
        leaderboardContainer.remove();
    };

    // Add click events for closing
    const closeButton = document.getElementById('close-leaderboard');
    closeButton.onclick = closeLeaderboard;

    try {
        console.log("📊 Fetching leaderboard data...");
        const { data, error } = await supabase
            .from('leaderboard')
            .select(`*`)
            .order('rank', { ascending: true })
            .limit(LEADERBOARD_SIZE);

        if (error) {
            console.error("❌ Leaderboard fetch error:", error);
            const tbody = document.getElementById('leaderboard-body');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4">Error loading leaderboard</td></tr>';
            }
            return;
        }

        console.log(`✅ Fetched leaderboard data:`, data);

        const topbar = document.getElementById('leaderboardTopbar');
        const content = document.getElementById('leaderboardContent');
        if (!topbar || !content) return;

        if (!data || data.length === 0) {
            content.innerHTML = '<p>No leaderboard data available.</p>';
            return;
        }

        renderLeaderboardParagraph(data, topbar, content);

    } catch (error) {
        console.error("❌ Leaderboard error:", error);
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4">Error loading leaderboard. Please try again.</td></tr>';
        }
    }

    // Change the close button event handler
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            const container = document.getElementById('leaderboard-container');
            if (container) {
                container.remove();
            }
        });
    }
}

function getTimeoutBand(timeout) {
    const bandStart = Math.floor(timeout / 100) * 100;
    const bandEnd = bandStart + 100;
    return `${bandStart}~${bandEnd}`;
}

function groupScoresByBand(entries) {
    const bands = {};
    entries.forEach(entry => {
        const [score, timeout] = entry.score.split('/').map(Number);
        const band = getTimeoutBand(timeout);
        if (!bands[band]) bands[band] = [];
        bands[band].push({ ...entry, scoreNum: score, timeoutNum: timeout, ratio: score / timeout });
    });
    return bands;
}

function sortAndBadgeBand(entries) {
    const sorted = entries.sort((a, b) => a.ratio - b.ratio);
    return sorted.map((entry, index) => ({
        ...entry,
        badge: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null
    }));
}

function scrollToBand(band) {
    const el = document.getElementById(`band-${band}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function renderLeaderboardParagraph(entries, topbar, content, page = 0) {
    const bands = groupScoresByBand(entries);
    const bandKeys = Object.keys(bands).sort((a, b) => Number(b.split('~')[0]) - Number(a.split('~')[0]));
    const bandsPerPage = 5;
    const start = page * bandsPerPage;
    const slice = bandKeys.slice(start, start + bandsPerPage);

    topbar.innerHTML = '';
    content.innerHTML = '';

    if (start > 0) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '[<]';
        prevBtn.onclick = () => renderLeaderboardParagraph(entries, page - 1);
        topbar.appendChild(prevBtn);
    }

    slice.forEach(band => {
        const btn = document.createElement('button');
        btn.textContent = `[${band}ms]`;
        btn.onclick = () => scrollToBand(band);
        topbar.appendChild(btn);
    });

    if (start + bandsPerPage < bandKeys.length) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '[>]';
        nextBtn.onclick = () => renderLeaderboardParagraph(entries, page + 1);
        topbar.appendChild(nextBtn);
    }

    slice.forEach(band => {
        const bandHeader = document.createElement('h3');
        bandHeader.id = `band-${band}`;
        bandHeader.textContent = `[${band}ms]`;
        content.appendChild(bandHeader);

        const sortedEntries = sortAndBadgeBand(bands[band]);
        sortedEntries.forEach((entry, index) => {
            const line = document.createElement('p');
            line.className = 'leaderboard-entry';

            const avatar = document.createElement('img');
            avatar.src = entry.avatar_url || 'images/default-avatar.png';
            avatar.className = 'leaderboard-avatar';
            avatar.onerror = () => { avatar.src = 'images/default-avatar.png'; };

            line.appendChild(document.createTextNode(`${entry.badge || index + 1}. `));
            line.appendChild(avatar);
            line.appendChild(document.createTextNode(` ${entry.username} — ${entry.score}`));

            content.appendChild(line);
        });

        const divider = document.createElement('hr');
        content.appendChild(divider);
    });
}

// === INITIALIZATION ===
async function init() {
    if (alreadyInited) return;
    
    // Starting Game...
    const startingH1 = document.getElementById('startingGame');
    startingH1.style.display = 'inline-block';
    setTimeout(() => {
        // after 3 sec...
        startingH1.style.display = 'none';
        ask_timeout(true);
    }, 3000)

    // Start with critical UI elements
    
    // Initialize game button events immediately
    const gameButton = document.querySelector('.round-btn');
    if (gameButton) {
        gameButton.addEventListener('mouseenter', block);
        gameButton.addEventListener('mouseleave', clearTimerOnMouseLeave);
        gameButton.addEventListener('click', after_click);
    }

    // Defer non-critical initializations
    requestIdleCallback(async () => {
        // Check session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
            logined = true;
            await post_login(session);
        }
        
        // Setup auth listener
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                logined = true;
                await post_login(session);
            }
        });
        
        // Setup utility buttons
        const darkModeCheckbox = document.querySelector('#dark-mode');
        const timeoutButton = document.querySelector('#ask-new-timeout');
        const leaderboardButton = document.getElementById('leaderboard');
        
        if (darkModeCheckbox) darkModeCheckbox.addEventListener('change', dark_mode);
        if (timeoutButton) timeoutButton.addEventListener('click', ask_timeout);
        if (leaderboardButton) leaderboardButton.addEventListener('click', showLeaderboard);
        
        const historyButton = document.getElementById('history');
        historyButton.addEventListener('click', showHistory);
        
        // hook up login-google
        document.getElementById('login-google').addEventListener('click', () => {
            const loginUrl = `https://gkfrlvfaersfknteuqwf.supabase.co/auth/v1/authorize?provider=google`;
            if (!logined) window.open(loginUrl, "_blank");
        });

        // Check cookies last
        const lastScore = getCookie('lastScore');
        if (lastScore) {
            const [score, time] = lastScore.split('/');
            console.log(`Last score: ${score}ms/${time}ms`);
        }
    });

    // Remove loading message
    console.log("init success!");
    alreadyInited = true;
}

// === EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
    init();
});