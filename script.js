import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === CONSTANTS & CONFIGURATIONS ===
const SUPABASE_URL = 'https://gkfrlvfaersfknteuqwf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZnJsdmZhZXJzZmtudGV1cXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODE5ODIsImV4cCI6MjA3MzQ1Nzk4Mn0.qnqj1sIT2hAcH2MOQawcbmKxq1iY_kaRZrSM_mLpgKc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COOKIE_EXPIRY = 30; // days
const HISTORY_KEY = 'clickHistory';
const MAX_HISTORY = 50; // maximum number of history entries to store

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

const LEADERBOARD_SIZE = 10; // Number of top scores to display
const COOKIE_OPTIONS = {
    expires: COOKIE_EXPIRY,
    path: '/',
    sameSite: 'strict'
};

// === AUTH FUNCTIONS ===
async function post_login(loginSession) {
    const user = loginSession.user;
    const login_google = document.querySelector("#login-google");
    const username_p = document.querySelector("#userName");
    const userEmail_p = document.querySelector("#userEmail");
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

    // username & highscore setup with labels and titles
    username_p.innerHTML = `<strong>Username:</strong><br>${data.username || 'None'}`;
    username_p.title = data.username || 'None'; // Add title for tooltip
    
    userEmail_p.innerHTML = `<strong>Email:</strong><br>${data.email || 'None'}`;
    userEmail_p.title = data.email || 'None'; // Add title for tooltip
    
    highscore_p.innerHTML = `<strong>Best Score:</strong><br>${data.high_score || 'None'}`;

    // Create high score container div
    const highScoreContainer = document.createElement('div');
    highScoreContainer.style.display = 'flex';
    highScoreContainer.style.alignItems = 'center';
    highScoreContainer.style.gap = '8px';
    
    // Move high score paragraph into container
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
    document.querySelector("#account-div").appendChild(highScoreContainer);

    // Show avatar container and user info elements
    avatarDiv.style.display = "block";
    const userInfoElements = [username_p, userEmail_p, highscore_p];
    userInfoElements.forEach(element => {
        if (element) {
            element.style.display = "block";
        }
    });

    // supabase db info filling

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
        
        // Clear and hide user info
        const userInfoElements = ["#userName", "#userEmail", "#highScore"];
        userInfoElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = "";
                element.style.display = "none";
            }
        });
        
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

    // 🧪 Safety check
    if (!timeout || lastElapsed === null) {
        console.warn("Missing timeout or elapsed time.");
        return;
    }

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
        msg.innerHTML = `<b><i>WHAT????????? YOU ACTUALLY CLICKED ON THAT BUTTON?</i></b><br><i>${dramaticMsg}</i>`;
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

    // 🔐 Record score to leaderboard if logged in
    if (logined) {
        try {
            console.log("🔄 Checking session...");
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                console.error("❌ Session error or no active session:", sessionError);
                return;
            }

            const user = session.user;
            const avatar = user?.user_metadata?.picture || null;
            const username = user?.user_metadata?.username || "Anonymous";
            const userId = user?.id;

            console.log("📊 Updating leaderboard...");

            // 🧾 Insert leaderboard entry
            const { error: leaderboardError } = await supabase
                .from('leaderboard')
                .insert({
                    click_time: new Date().toISOString(),
                    score: scoreStr,
                    timeout,
                    avatar_url: avatar,
                    username,
                    user_id: userId,
                    rank: null
                });

            if (leaderboardError) {
                console.error("❌ Leaderboard insert error:", leaderboardError);
            } else {
                console.log("✅ Score recorded to leaderboard");
            }

            const { data: scores, error: fetchError } = await supabase
            .from('leaderboard')
            .select('score, user_id');

            if (!fetchError && scores?.length) {
                const currentRatio = lastElapsed / timeout;

                const ranked = scores
                    .map(entry => {
                    const [s, t] = entry.score.split('/').map(Number);
                    return { ...entry, ratio: s / t };
                    })
                    .sort((a, b) => a.ratio - b.ratio);

                const rank = ranked.findIndex(entry => entry.user_id === session.user.id) + 1;

                await supabase
                    .from('leaderboard')
                    .update({ rank })
                    .eq('user_id', session.user.id)
                    .eq('score', scoreStr);
                }

            // 🧠 Fetch user data for high score comparison
            const { data: userData, error: userError } = await supabase
                .from('clickers')
                .select('*')
                .eq('id', userId)
                .single();

            if (userError || !userData) {
                console.warn("⚠️ Could not fetch user data for high score comparison.");
                return;
            }

            const currentRatio = lastElapsed / timeout;
            const highScore = userData.high_score;

            if (highScore) {
                const [existingScore, existingTimeout] = highScore.split('/').map(Number);
                const existingRatio = existingScore / existingTimeout;

                if (currentRatio < existingRatio) {
                    console.log("🏆 New personal best!");
                    const { error: updateError } = await supabase
                        .from('clickers')
                        .update({ high_score: scoreStr })
                        .eq('id', userId);

                    if (updateError) {
                        console.error("❌ High score update error:", updateError);
                    } else {
                        const highScoreElement = document.querySelector("#highScore");
                        if (highScoreElement) {
                            highScoreElement.innerHTML = `<strong>Best Score:</strong><br>${scoreStr}`;
                        }
                    }
                }
            } else {
                const { error: updateError } = await supabase
                    .from('clickers')
                    .update({ high_score: scoreStr })
                    .eq('id', userId);

                if (updateError) {
                    console.error("❌ First high score update error:", updateError);
                } else {
                    const highScoreElement = document.querySelector("#highScore");
                    if (highScoreElement) {
                        highScoreElement.innerHTML = `<strong>Best Score:</strong><br>${scoreStr}`;
                    }
                }
            }

        } catch (error) {
            console.error("❌ Error recording score:", error);
        }
    }

    // 🧊 Cooldown
    setTimeout(() => {
        btn_clicked = false;
    }, 1000);
}

// === UTILITY FUNCTIONS ===
function dark_mode() {
    const utilityDiv = document.getElementById('utility');
    const accountDiv = document.getElementById('account-div');
    const label = document.querySelector('#utility label');

    // Get computed style instead of direct style
    const isLight = window.getComputedStyle(body).backgroundColor === "rgb(255, 255, 255)";

    // Background and text
    body.style.backgroundColor = isLight ? "black" : "white";
    body.style.color = isLight ? "white" : "black";

    // Utility div
    if (utilityDiv) {
        utilityDiv.style.backgroundColor = isLight ? "#222" : "#eee";
        utilityDiv.style.borderColor = isLight ? "#888" : "#aaa";
    }

    // Account div
    if (accountDiv) {
        accountDiv.style.backgroundColor = isLight ? "#222" : "#eee";
        accountDiv.style.borderColor = isLight ? "#888" : "#aaa";
    }

    // Label
    if (label) {
        label.style.color = isLight ? "white" : "black";
    }

    // Score text if it exists
    const scoreText = document.querySelector('.dynamic-msg span');
    if (scoreText) {
        scoreText.style.color = isLight ? "yellow" : "#003366";
    }

    // HR elements
    document.querySelectorAll('hr').forEach(hr => {
        hr.style.borderTopColor = isLight ? "white" : "black";
    });
}

function ask_timeout() {
    while (true) {
        let temp_timeout = prompt("Enter delay in milliseconds before the alert fires: (100 🏃 to 1000 🐢)\nOr press Cancel to close the window.");
        if (temp_timeout === null) {
            let close_decision = confirm('You clicked Cancel. Close the window?');
            if (close_decision) {
                window.close();
                return;
            } else {
                continue;
            }
        }
        let input_int = parseInt(temp_timeout);

        if (!isNaN(input_int) && input_int >= 100 && input_int <= 1000) {
            timeout = input_int;
            break;
        } else if (!isNaN(input_int)) {
            alert("Hey! Your number isn't from 100ms to 1000ms!");
        } else {
            alert("Hey! That's not even a number!");
        }
    }
    document.getElementById('teleportation').innerHTML = `P.S. You have <strong>${timeout}ms</strong> before the alert fires.`
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
    
    startBtn?.removeEventListener("click", startGame);
    startBtn?.addEventListener("click", startGame);
    
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

async function showHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    
    // Remove existing history view
    const existingHistory = document.getElementById('history-container');
    if (existingHistory) {
        existingHistory.remove();
    }

    const historyContainer = document.createElement('div');
    historyContainer.id = 'history-container';
    historyContainer.innerHTML = `
        <div class="history-modal">
            <h2>📜 Your History 📜</h2>
            <div class="history-content">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Score</th>
                            <th>Timeout</th>
                            <th>Ratio</th>
                        </tr>
                    </thead>
                    <tbody id="history-body">
                        ${history.length === 0 ? 
                            '<tr><td colspan="4">No history available</td></tr>' : 
                            history
                                .sort((a, b) => a.timeout - b.timeout || a.ratio - b.ratio)
                                .map(entry => `
                                    <tr>
                                        <td>${new Date(entry.timestamp).toLocaleString()}</td>
                                        <td>${entry.score}ms</td>
                                        <td>${entry.timeout}ms</td>
                                        <td>${entry.ratio}</td>
                                    </tr>
                                `).join('')
                        }
                    </tbody>
                </table>
            </div>
            <button id="close-history">Close</button>
            <button id="clear-history">Clear History</button>
        </div>
    `;

    document.body.appendChild(historyContainer);

    // Add event listeners
    document.getElementById('close-history').addEventListener('click', () => {
        historyContainer.remove();
    });

    document.getElementById('clear-history').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your history?')) {
            localStorage.removeItem(HISTORY_KEY);
            historyContainer.remove();
            showHistory(); // Reopen with empty state
        }
    });
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
            <div class="leaderboard-content">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Score</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody id="leaderboard-body">
                        <tr><td colspan="4">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <button id="close-leaderboard" type="button">Close</button>
        </div>
    `;

    document.body.appendChild(leaderboardContainer);

    // Add both click and keyboard events for closing
    const closeButton = document.getElementById('close-leaderboard');
    closeButton.onclick = closeLeaderboard;
    
    // Add escape key support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLeaderboard();
    });

    try {
        console.log("📊 Fetching leaderboard data...");
        const { data, error } = await supabase
            .from('leaderboard')
            .select(`
                id,
                click_time,
                score,
                rank,
                avatar_url,
                username
            `)
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
        const tbody = document.getElementById('leaderboard-body');
        
        if (!tbody) {
            console.error("❌ Leaderboard tbody not found");
            return;
        }
        
        if (!data || data.length === 0) {
            console.log("ℹ️ No leaderboard data available");
            tbody.innerHTML = '<tr><td colspan="4">No Data Available</td></tr>';
            return;
        }

        // Update the table with correct data mapping
        tbody.innerHTML = data.map((entry) => `
            <tr>
                <td>${entry.rank || 'N/A'}</td>
                <td class="player-cell">
                    <img src="${entry.avatar_url}" alt="Avatar" class="leaderboard-avatar" 
                        onerror="this.src='images/default-avatar.png';">
                    ${entry.username || 'Anonymous'}
                </td>
                <td>${entry.score || 'N/A'}</td>
                <td>${new Date(entry.click_time).toLocaleDateString()}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error("❌ Leaderboard error:", error);
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4">Error loading leaderboard. Please try again.</td></tr>';
        }
    }

    // Change the close button event handler
    //const closeButton = document.getElementById('close-leaderboard');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            const container = document.getElementById('leaderboard-container');
            if (container) {
                container.remove();
            }
        });
    }
}

// === INITIALIZATION ===
async function init() {
    if (alreadyInited) return;
    
    // Start with critical UI elements
    ask_timeout();
    
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
        const utilityDiv = document.getElementById('utility');
        
        if (darkModeCheckbox) darkModeCheckbox.addEventListener('change', dark_mode);
        if (timeoutButton) timeoutButton.addEventListener('click', ask_timeout);
        if (leaderboardButton) leaderboardButton.addEventListener('click', showLeaderboard);
        
        // Add history button
        if (utilityDiv) {
            const historyButton = document.createElement('button');
            historyButton.id = 'history-button';
            historyButton.textContent = '📜 History';
            historyButton.addEventListener('click', showHistory);
            utilityDiv.appendChild(historyButton);
        }
        
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

// === EXPORTS (if needed) ===
export {
    dark_mode,
    ask_timeout,
    block,
    clearTimerOnMouseLeave,
    after_click
};