// תמונות ומשאבים
const SONIC_IMG_PATH = 'uploads/Sonic_the_Hedgehog.png';
const RING_ICON = '💍';

// יצירת אובייקטי אודיו מראש כדי למנוע יצירה חוזרת שעלולה לגרום לעיכובים
const SOUND_EFFECTS = {
    correct: new Audio('sounds/tada-fanfare-a-6313.mp3'),
    wrong: new Audio('sounds/wrong-47985.mp3'),
    congrats: new Audio('sounds/congrats.mp3'),
    boost: new Audio('sounds/boost.mp3')
};

// מצב המשחק
const gameState = {
    currentLevel: 0,
    correctCount: 0,
    totalLevels: 10,
    maxNumber: 10,         // יעודכן אוטומטית לפי רמת הקושי: קל (3), בינוני (5), קשה (10)
    soundEnabled: true,
    language: 'he',
    difficulty: 'medium',  // קל (easy), בינוני (medium), קשה (hard)
    attempts: [],
    streakCount: 0,
    audioInitialized: false,
    audioContext: null
};

// תרגומים
const translations = {
    he: {
        howMany: "כמה סוניקים אתה רואה?",
        correct: (num) => `כל הכבוד! זה ${getHebrewNumber(num)}!`,
        tryAgain: "נסה שוב",
        champion: "אלוף הספירה!",
        congrats: "כל הכבוד!",
        playAgain: "שחק שוב",
        close: "סגור",
        sounds: "צלילים",
        numberRange: "טווח מספרים",
        language: "שפה",
        difficulty: "רמת קושי",
        easy: "קל",
        medium: "בינוני",
        hard: "קשה"
    },
    en: {
        howMany: "How many Sonics do you see?",
        correct: (num) => `Great job! That's ${num}!`,
        tryAgain: "Try again",
        champion: "Counting Champion!",
        congrats: "Congratulations!",
        playAgain: "Play Again",
        close: "Close",
        sounds: "Sounds",
        numberRange: "Number Range",
        language: "Language",
        difficulty: "Difficulty",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard"
    }
};

// המרה למספרים בעברית
function getHebrewNumber(num) {
    const hebrewNumbers = ['אפס', 'אחד', 'שניים', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה', 'עשרה'];
    return hebrewNumbers[num];
}

// אתחול המשחק
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initSettings();
    startNewLevel();
    initFullscreenFeature();
    initTouchEvents();
    setupAudioContext();
    
    // בדיקה אם זה מכשיר נייד כדי לאפשר "פעימת משתמש" לסאונד
    if (isMobileDevice()) {
        initMobileAudio();
    }
    
    // הוספת מאזין לכל האזור כדי לאתחל אודיו
    document.body.addEventListener('click', initAudioOnUserAction);
    document.body.addEventListener('touchstart', initAudioOnUserAction);
});

// אתחול ממשק המשתמש
function initUI() {
    // יצירת כפתורי המספרים
    const buttonContainer = document.getElementById('numberButtons');
    buttonContainer.innerHTML = '';

    // צבעים לכפתורים
    const buttonColors = [
        '#FF5252', '#FF9800', '#FFEB3B', 
        '#66BB6A', '#29B6F6', '#7E57C2', 
        '#EC407A', '#26A69A', '#78909C', '#FFA726'
    ];

    // יצירת הכפתורים עם צבעים
    for (let i = 1; i <= gameState.maxNumber; i++) {
        const button = document.createElement('button');
        button.className = 'number-button';
        button.textContent = i;
        button.style.backgroundColor = buttonColors[i - 1];
        
        // הוספת אייקון טבעת קטן
        const ringIcon = document.createElement('span');
        ringIcon.className = 'ring-icon';
        ringIcon.textContent = RING_ICON;
        button.appendChild(ringIcon);
        
        button.addEventListener('click', () => handleNumberClick(i));
        buttonContainer.appendChild(button);
    }
}

// התחלת שלב חדש
function startNewLevel() {
    // אם סיימנו את כל השלבים
    if (gameState.currentLevel >= gameState.totalLevels) {
        showCongratulations();
        return;
    }

    // יצירת מספר רנדומלי של סוניקים (1 עד מקסימום לפי רמת הקושי)
    const sonicCount = Math.floor(Math.random() * gameState.maxNumber) + 1;
    
    // אתחול מסך המשחק
    const gameScene = document.getElementById('gameScene');
    gameScene.innerHTML = '';
    
    // חישוב גודל הדמות בהתאם למספר הסוניקים
    const sonicSize = calculateSonicSize(sonicCount);
    
    // מיקומים תפוסים למניעת חפיפה
    const takenPositions = [];
    
    // יצירת דמויות סוניק
    for (let i = 0; i < sonicCount; i++) {
        const sonic = document.createElement('div');
        sonic.className = 'sonic-character';
        sonic.style.backgroundImage = `url(${SONIC_IMG_PATH})`;
        
        // וריאציות אקראיות בצבע/גודל כדי להקל על ספירה
        const hueRotate = Math.floor(Math.random() * 40) - 20;
        const scale = 0.9 + (Math.random() * 0.2);
        
        sonic.style.filter = `drop-shadow(3px 3px 3px rgba(0,0,0,0.3)) hue-rotate(${hueRotate}deg)`;
        sonic.style.transform = `scale(${scale})`;
        
        // קביעת גודל בהתאם למספר הדמויות
        sonic.style.width = sonicSize + 'px';
        sonic.style.height = sonicSize + 'px';
        
        // מיקום אקראי בגבולות ההיגיון
        if (sonicCount > 1) {
            const position = getRandomPosition(takenPositions, sonicSize);
            sonic.style.position = 'absolute';
            sonic.style.left = position.x + '%';
            sonic.style.top = position.y + '%';
            takenPositions.push(position);
        }
        
        // שונות באנימציה
        const randomDelay = Math.random() * 0.5;
        sonic.style.animationDelay = `${randomDelay}s`;
        
        gameScene.appendChild(sonic);
    }
    
    // שמירת המספר הנכון
    gameState.currentAnswer = sonicCount;
    
    // איפוס מספר הניסיונות לשלב זה
    gameState.attempts[gameState.currentLevel] = 0;
}

// חישוב גודל הדמויות בהתאם למספר
function calculateSonicSize(count) {
    // בסיס גודל התלוי במספר הדמויות
    let baseSize;
    
    if (count <= 3) {
        baseSize = 80;  // גדול לכמות קטנה
    } else if (count <= 6) {
        baseSize = 70;  // בינוני לכמות בינונית
    } else {
        baseSize = 60;  // קטן לכמות גדולה
    }
    
    // התאמה לגודל המסך
    if (window.innerWidth < 400) {
        baseSize = Math.max(40, baseSize * 0.8);
    } else if (window.innerHeight < 600) {
        baseSize = Math.max(50, baseSize * 0.9);
    }
    
    return baseSize;
}

// קבלת מיקום אקראי שלא חופף עם מיקומים קיימים
function getRandomPosition(takenPositions, sonicSize) {
    const margin = 5;  // מרווח מינימלי מהשוליים באחוזים
    const safeDistance = (sonicSize / window.innerWidth) * 100 + 5;  // מרחק בטוח בין דמויות באחוזים
    
    let position;
    let attempts = 0;
    let valid = false;
    
    // ניסיון למצוא מיקום חוקי
    while (!valid && attempts < 50) {
        position = {
            x: margin + Math.random() * (100 - 2 * margin - (sonicSize / window.innerWidth) * 100),
            y: margin + Math.random() * (70 - 2 * margin - (sonicSize / window.innerHeight) * 100) // רק ב-70% העליון (מעל הקרקע)
        };
        
        valid = true;
        
        // בדיקת התנגשויות עם דמויות קיימות
        for (let i = 0; i < takenPositions.length; i++) {
            const distance = Math.sqrt(
                Math.pow(position.x - takenPositions[i].x, 2) + 
                Math.pow(position.y - takenPositions[i].y, 2)
            );
            
            if (distance < safeDistance) {
                valid = false;
                break;
            }
        }
        
        attempts++;
    }
    
    // אם לא מצאנו מיקום אחרי 50 ניסיונות, פשוט נבחר מיקום אקראי
    if (!valid) {
        position = {
            x: margin + Math.random() * (100 - 2 * margin - (sonicSize / window.innerWidth) * 100),
            y: margin + Math.random() * (70 - 2 * margin - (sonicSize / window.innerHeight) * 100)
        };
    }
    
    return position;
}

// טיפול בלחיצה על מספר
function handleNumberClick(selectedNumber) {
    gameState.attempts[gameState.currentLevel]++;
    
    if (selectedNumber === gameState.currentAnswer) {
        // תשובה נכונה
        showFeedback(translations[gameState.language].correct(selectedNumber), 'correct');
        
        // נותן אנימציה לכל הסוניקים
        document.querySelectorAll('.sonic-character').forEach(sonic => {
            sonic.classList.add('correct');
        });
        
        // מעלה את הסטריק של תשובות נכונות
        gameState.streakCount++;
        
        // משמיע צליל נכון
        if (gameState.soundEnabled) {
            playSound(SOUND_EFFECTS.correct);
        }
        
        // בודק אם צריך להפעיל אפקט בוסט
        if (gameState.streakCount === 3) {
            triggerBoostEffect();
            gameState.streakCount = 0;
        }
        
        // מעבר לשלב הבא אחרי השהייה
        setTimeout(() => {
            gameState.currentLevel++;
            gameState.correctCount++;
            startNewLevel();
        }, 1500);
    } else {
        // תשובה שגויה
        showFeedback(translations[gameState.language].tryAgain, 'wrong');
        
        // מוסיף אנימציית רעידה
        const buttons = document.querySelectorAll('.number-button');
        buttons[selectedNumber - 1].classList.add('wrong');
        
        // מסיר את האנימציה אחרי שהיא הסתיימה
        setTimeout(() => {
            buttons[selectedNumber - 1].classList.remove('wrong');
        }, 500);
        
        // מאפס את הסטריק
        gameState.streakCount = 0;
        
        // משמיע צליל שגוי
        if (gameState.soundEnabled) {
            playSound(SOUND_EFFECTS.wrong);
        }
    }
}

// מציג משוב למשתמש
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type} show`;
    
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 1500);
}

// מציג את מסך הברכות
function showCongratulations() {
    const modal = document.getElementById('congratsModal');
    modal.classList.add('show');
    
    if (gameState.soundEnabled) {
        playSound(SOUND_EFFECTS.congrats);
    }
    
    // עדכון תוכן המודל
    const congratsHeading = modal.querySelector('h2');
    const congratsText = modal.querySelector('p');
    const playAgainButton = document.getElementById('playAgainButton');
    
    congratsHeading.textContent = translations[gameState.language].congrats;
    congratsText.textContent = translations[gameState.language].champion;
    playAgainButton.textContent = translations[gameState.language].playAgain;
    
    // מוסיף מידע על ביצועים להורים
    const performanceInfo = document.createElement('div');
    performanceInfo.className = 'performance-info';
    performanceInfo.innerHTML = `<hr><small>ניסיונות לכל שלב: ${gameState.attempts.join(', ')}</small>`;
    modal.querySelector('.congrats-content').appendChild(performanceInfo);
    
    // לחיצה על כפתור "שחק שוב"
    playAgainButton.addEventListener('click', resetGame);
}

// מאפס את המשחק
function resetGame() {
    const modal = document.getElementById('congratsModal');
    modal.classList.remove('show');
    
    // ניקוי מידע ביצועים ישן
    const performanceInfo = modal.querySelector('.performance-info');
    if (performanceInfo) {
        performanceInfo.remove();
    }
    
    gameState.currentLevel = 0;
    gameState.correctCount = 0;
    gameState.streakCount = 0;
    gameState.attempts = [];
    
    startNewLevel();
}

// מפעיל אפקט בוסט
function triggerBoostEffect() {
    if (gameState.soundEnabled) {
        playSound(SOUND_EFFECTS.boost);
    }
    
    const gameScene = document.getElementById('gameScene');
    const boost = document.createElement('div');
    boost.className = 'boost';
    boost.style.backgroundImage = `url(${SONIC_IMG_PATH})`;
    
    // הוספת אפקט מהירות
    boost.style.filter = 'brightness(1.2) blur(2px)';
    
    gameScene.appendChild(boost);
    
    // הסרה אחרי שהאנימציה הסתיימה
    setTimeout(() => {
        boost.remove();
    }, 1500);
}

// אתחול תפריט ההגדרות
function initSettings() {
    const settingsButton = document.getElementById('settingsButton');
    const settingsMenu = document.getElementById('settingsMenu');
    const closeButton = document.getElementById('closeSettings');
    const soundToggle = document.getElementById('soundToggle');
    const numberRange = document.getElementById('numberRange');
    const languageSelect = document.getElementById('languageSelect');
    
    // יצירת בורר רמת קושי
    const difficultyContainer = document.createElement('div');
    difficultyContainer.className = 'setting-item';
    difficultyContainer.innerHTML = `
        <label for="difficultySelect">${translations[gameState.language].difficulty}:</label>
        <div class="setting-control">
            <select id="difficultySelect">
                <option value="easy">${translations[gameState.language].easy}</option>
                <option value="medium">${translations[gameState.language].medium}</option>
                <option value="hard">${translations[gameState.language].hard}</option>
            </select>
        </div>
    `;
    
    // הוספת בורר רמת הקושי למסך ההגדרות
    const settingsContent = document.querySelector('.settings-content');
    settingsContent.insertBefore(difficultyContainer, document.querySelector('.setting-item:last-child'));
    
    const difficultySelect = document.getElementById('difficultySelect');
    difficultySelect.value = gameState.difficulty;
    
    // פתיחת וסגירת התפריט
    settingsButton.addEventListener('click', () => {
        settingsMenu.classList.add('show');
    });
    
    closeButton.addEventListener('click', () => {
        settingsMenu.classList.remove('show');
    });
    
    // הגדרות צליל
    soundToggle.checked = gameState.soundEnabled;
    soundToggle.addEventListener('change', () => {
        gameState.soundEnabled = soundToggle.checked;
    });
    
    // טווח מספרים (יוסתר אם משתמשים ברמות קושי)
    numberRange.value = gameState.maxNumber;
    numberRange.parentElement.parentElement.style.display = 'none'; // מסתיר את בורר טווח המספרים
    
    // בחירת רמת קושי
    difficultySelect.addEventListener('change', () => {
        gameState.difficulty = difficultySelect.value;
        
        // עדכון מספר מקסימלי לפי רמת הקושי
        switch(gameState.difficulty) {
            case 'easy':
                gameState.maxNumber = 3;
                break;
            case 'medium':
                gameState.maxNumber = 5;
                break;
            case 'hard':
                gameState.maxNumber = 10;
                break;
        }
        
        initUI(); // עדכון ממשק המשתמש בהתאם לרמה
    });
    
    // שפה
    languageSelect.value = gameState.language;
    languageSelect.addEventListener('change', () => {
        gameState.language = languageSelect.value;
        updateUILanguage();
        
        // עדכון התוויות של רמת הקושי
        document.querySelector('label[for="difficultySelect"]').textContent = 
            translations[gameState.language].difficulty + ':';
        
        // עדכון ערכי הבחירה
        const options = difficultySelect.querySelectorAll('option');
        options[0].textContent = translations[gameState.language].easy;
        options[1].textContent = translations[gameState.language].medium;
        options[2].textContent = translations[gameState.language].hard;
    });
    
    // קביעת ערך התחלתי של רמת הקושי ועדכון מספר מקסימלי בהתאם
    switch(gameState.difficulty) {
        case 'easy':
            gameState.maxNumber = 3;
            break;
        case 'medium':
            gameState.maxNumber = 5;
            break;
        case 'hard':
            gameState.maxNumber = 10;
            break;
    }
    
    initUI(); // עדכון ממשק המשתמש בהתאם לרמה שנבחרה
}

// עדכון שפת ממשק המשתמש
function updateUILanguage() {
    document.documentElement.lang = gameState.language;
    document.documentElement.dir = gameState.language === 'he' ? 'rtl' : 'ltr';
    
    // עדכון כותרת
    document.querySelector('h1').textContent = gameState.language === 'he' ? 'כמה סוניקים?' : 'How Many Sonics?';
    
    // עדכון כפתורים בהגדרות
    document.getElementById('closeSettings').textContent = translations[gameState.language].close;
    
    // עדכון תוויות
    const labels = document.querySelectorAll('.setting-item label:first-child');
    let difficultyIndex = -1;
    
    for (let i = 0; i < labels.length; i++) {
        if (labels[i].getAttribute('for') === 'difficultySelect') {
            difficultyIndex = i;
            break;
        }
    }
    
    if (difficultyIndex !== -1) {
        // סדר התוויות עם רמת הקושי
        labels[0].textContent = translations[gameState.language].sounds + ':';
        labels[difficultyIndex].textContent = translations[gameState.language].difficulty + ':';
        labels[labels.length - 1].textContent = translations[gameState.language].language + ':';
        
        // עדכון אפשרויות רמת הקושי
        const difficultySelect = document.getElementById('difficultySelect');
        if (difficultySelect) {
            const options = difficultySelect.querySelectorAll('option');
            options[0].textContent = translations[gameState.language].easy;
            options[1].textContent = translations[gameState.language].medium;
            options[2].textContent = translations[gameState.language].hard;
        }
    } else {
        // סדר התוויות המקורי
        labels[0].textContent = translations[gameState.language].sounds + ':';
        labels[1].textContent = translations[gameState.language].numberRange + ':';
        labels[2].textContent = translations[gameState.language].language + ':';
    }
}

// אתחול אודיו קונטקסט - עובד טוב יותר במובייל
function setupAudioContext() {
    try {
        // יצירת AudioContext (תומך ברוב הדפדפנים המודרניים)
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        gameState.audioContext = new AudioContext();
        
        // במובייל (במיוחד iOS), האודיו קונטקסט מתחיל במצב מושהה
        if (gameState.audioContext.state === 'suspended') {
            console.log('AudioContext במצב מושהה - ממתין לאינטראקציית משתמש');
        }
    } catch (e) {
        console.log('Web Audio API אינו נתמך בדפדפן זה:', e);
    }
}

// אתחול אודיו על פעולת משתמש - חשוב במיוחד עבור iOS
function initAudioOnUserAction() {
    if (gameState.audioContext && gameState.audioContext.state === 'suspended') {
        gameState.audioContext.resume().then(() => {
            console.log('AudioContext התחיל לפעול על סמך אינטראקציית משתמש');
            gameState.audioInitialized = true;
        });
    }
    
    // שומע לאודיו באופן ישיר (שיטה חלופית)
    if (!gameState.audioInitialized) {
        const silentSound = new Audio('sounds/silent.mp3');
        silentSound.play().then(() => {
            gameState.audioInitialized = true;
            console.log('אודיו אותחל בהצלחה');
            
            // טעינה מוקדמת של כל הצלילים
            for (const key in SOUND_EFFECTS) {
                SOUND_EFFECTS[key].load();
            }
        }).catch(e => {
            console.log('לא ניתן לאתחל אודיו:', e);
        });
    }
    
    // הסרת המאזינים לאחר הצלחה
    if (gameState.audioInitialized) {
        document.body.removeEventListener('click', initAudioOnUserAction);
        document.body.removeEventListener('touchstart', initAudioOnUserAction);
    }
}

// פונקציה להשמעת סאונד שמטפלת במגבלות הנייד
function playSound(sound) {
    if (!gameState.soundEnabled) return;
    
    try {
        // אם האודיו קונטקסט מושהה, ננסה להפעילו
        if (gameState.audioContext && gameState.audioContext.state === 'suspended') {
            gameState.audioContext.resume();
        }
        
        // איפוס הסאונד כדי לאפשר השמעה חוזרת
        sound.currentTime = 0;
        
        // ניסיון לנגן
        const playPromise = sound.play();
        
        // טיפול במקרה של דחיית ניגון (בד"כ במובייל)
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('אודיו נדחה:', error);
                // במקרה של שגיאה, ננסה שוב לאחר אינטראקציית משתמש
                if (!gameState.audioInitialized) {
                    // מציג הודעה למשתמש לגעת במסך
                    showAudioPrompt();
                }
            });
        }
    } catch (e) {
        console.log('שגיאת השמעת אודיו:', e);
    }
}

// הצגת הודעה למשתמש לגעת במסך לאפשור סאונד
function showAudioPrompt() {
    const existingPrompt = document.querySelector('.audio-prompt');
    if (existingPrompt) return;
    
    const audioPrompt = document.createElement('div');
    audioPrompt.className = 'audio-prompt';
    audioPrompt.textContent = gameState.language === 'he' ? 
        'לחץ על המסך להפעלת צלילים' : 
        'Tap screen to enable sounds';
    document.body.appendChild(audioPrompt);
    
    // הסרת ההודעה לאחר 5 שניות
    setTimeout(() => {
        if (audioPrompt.parentNode) {
            audioPrompt.parentNode.removeChild(audioPrompt);
        }
    }, 5000);
}

// טיפול במצב PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').then(registration => {
            console.log('ServiceWorker registered: ', registration);
        }).catch(error => {
            console.log('ServiceWorker registration failed: ', error);
        });
    });
}

// בדיקה אם המכשיר הוא נייד
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

// אתחול אודיו למובייל - כדי לעקוף את המגבלות של iOS
function initMobileAudio() {
    // הודעה לשחקן בהתחלה
    const audioPrompt = document.createElement('div');
    audioPrompt.className = 'audio-prompt';
    audioPrompt.textContent = gameState.language === 'he' ? 
        'לחץ על המסך להפעלת צלילים' : 
        'Tap to enable sounds';
    document.body.appendChild(audioPrompt);
    
    // מסירים את ההודעה אחרי לחיצה ראשונה
    const removePrompt = () => {
        if (audioPrompt.parentNode) {
            audioPrompt.parentNode.removeChild(audioPrompt);
            document.body.removeEventListener('click', removePrompt);
            document.body.removeEventListener('touchstart', removePrompt);
        }
    };
    
    document.body.addEventListener('click', removePrompt);
    document.body.addEventListener('touchstart', removePrompt);
}

// הוספת מאזיני אירועים למסך מגע
function initTouchEvents() {
    // למניעת התנהגויות ברירת מחדל כמו גרירה ופינץ'
    document.addEventListener('touchmove', function(e) {
        if (e.target.className !== 'settings-content' &&
            e.target.className !== 'congrats-content') {
            e.preventDefault();
        }
    }, { passive: false });
    
    // מניעת זום כפול-טאפ
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd < 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// פונקציות מסך מלא
function initFullscreenFeature() {
    // הכפתור בתפריט ההגדרות
    const fullscreenButton = document.getElementById('fullscreenToggle');
    
    // הכותרת בראש המשחק
    const gameTitle = document.getElementById('gameTitle');
    
    // אם מסך מלא לא נתמך, מסתירים את האפשרות
    if (!document.fullscreenEnabled && 
        !document.webkitFullscreenEnabled && 
        !document.mozFullScreenEnabled &&
        !document.msFullscreenEnabled) {
        
        const fullscreenOption = fullscreenButton.closest('.setting-item');
        if (fullscreenOption) {
            fullscreenOption.style.display = 'none';
        }
        return;
    }
    
    // מגדירים התנהגות לכפתור בתפריט
    fullscreenButton.addEventListener('click', toggleFullScreen);
    
    // אפשר גם להיכנס למסך מלא בלחיצה על הכותרת
    gameTitle.addEventListener('click', toggleFullScreen);
    gameTitle.style.cursor = 'pointer';
    
    // עדכון כיתוב הכפתור בהתאם למצב מסך מלא
    document.addEventListener('fullscreenchange', updateFullscreenButtonText);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButtonText);
    document.addEventListener('mozfullscreenchange', updateFullscreenButtonText);
    document.addEventListener('MSFullscreenChange', updateFullscreenButtonText);
}

// מעבר למסך מלא וחזרה
function toggleFullScreen() {
    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement) {
        
        // נכנס למסך מלא
        const gameContainer = document.querySelector('.game-container');
        
        if (gameContainer.requestFullscreen) {
            gameContainer.requestFullscreen();
        } else if (gameContainer.webkitRequestFullscreen) {
            gameContainer.webkitRequestFullscreen();
        } else if (gameContainer.mozRequestFullScreen) {
            gameContainer.mozRequestFullScreen();
        } else if (gameContainer.msRequestFullscreen) {
            gameContainer.msRequestFullscreen();
        }
    } else {
        // יציאה ממסך מלא
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// עדכון טקסט הכפתור בהתאם למצב
function updateFullscreenButtonText() {
    const fullscreenButton = document.getElementById('fullscreenToggle');
    
    if (document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement) {
        fullscreenButton.textContent = gameState.language === 'he' ? 'בטל' : 'Exit';
    } else {
        fullscreenButton.textContent = gameState.language === 'he' ? 'הפעל' : 'Enter';
    }
} 