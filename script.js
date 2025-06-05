let wordsData = {};
let currentStage = 1;
let score = 0;
let bonusScore = 0;
let timeLeft = 120;
let timerInterval;
let selectedLetters = [];
let foundWords = [];
let creativeWords = [];
let soundEnabled = true;
let soundInitialized = false;

const clickSound = new Audio('https://www.soundjay.com/buttons/button-09.mp3');
const successSound = new Audio('https://www.soundjay.com/buttons/beep-07.mp3');
const stageSound = new Audio('https://www.soundjay.com/buttons/beep-02.mp3');

function initializeSound() {
    if (!soundInitialized) {
        [clickSound, successSound, stageSound].forEach(audio => {
            audio.load();
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
            }).catch(err => console.log('خطا در آماده‌سازی صدا:', err));
        });
        soundInitialized = true;
    }
}

function playSound(audio) {
    if (soundEnabled && soundInitialized) {
        audio.currentTime = 0;
        audio.play().catch(err => console.log('خطا در پخش صدا:', err));
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.innerHTML = message;
    errorDiv.style.display = 'block';
    document.querySelector('.game-container').style.pointerEvents = 'none';
}

function showHint() {
    const stageData = wordsData[currentStage.toString()];
    const stageWords = stageData.words || stageData;
    const remainingWords = stageWords.filter(word => !foundWords.includes(word));
    if (remainingWords.length > 0) {
        const hintWord = remainingWords[0];
        document.getElementById('hint-message').innerText = `راهنمایی: کلمه‌ای با حرف «${hintWord[0]}» شروع می‌شود`;
        document.getElementById('hint-message').style.display = 'block';
        setTimeout(() => {
            document.getElementById('hint-message').style.display = 'none';
        }, 3000);
        bonusScore -= 5;
        document.getElementById('bonus-score').innerText = bonusScore;
        document.getElementById('hint-button').disabled = bonusScore < 5;
        saveProgress();
    }
}

function saveProgress() {
    localStorage.setItem('currentStage', currentStage);
    localStorage.setItem('score', score);
    localStorage.setItem('bonusScore', bonusScore);
    localStorage.setItem('creativeWords', JSON.stringify(creativeWords));
    localStorage.setItem('soundEnabled', soundEnabled);
}

function loadProgress() {
    currentStage = parseInt(localStorage.getItem('currentStage')) || 1;
    score = parseInt(localStorage.getItem('score')) || 0;
    bonusScore = parseInt(localStorage.getItem('bonusScore')) || 0;
    creativeWords = JSON.parse(localStorage.getItem('creativeWords')) || [];
    soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    document.getElementById('score').innerText = score;
    document.getElementById('stage').innerText = currentStage;
    document.getElementById('bonus-score').innerText = bonusScore;
    document.getElementById('hint-button').disabled = bonusScore < 5;
    document.getElementById('sound-toggle').classList.toggle('muted', !soundEnabled);
    creativeWords.forEach(word => {
        document.getElementById('creative-words').innerHTML += `<div class="creative-word">${word}</div>`;
    });
}

document.getElementById('sound-toggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    document.getElementById('sound-toggle').classList.toggle('muted', !soundEnabled);
    if (soundEnabled && !soundInitialized) {
        initializeSound();
    }
    saveProgress();
});

fetch('./amirza.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('فایل JSON پیدا نشد یا در دسترس نیست.');
        }
        return response.json();
    })
    .then(data => {
        wordsData = data;
        loadProgress();
        initializeSound();
        startStage(currentStage);
    })
    .catch(error => {
        console.error('خطا در لود JSON:', error);
        showError(`خطا: ${error.message} <br><button onclick="location.reload()">تلاش مجدد</button>`);
    });

function startStage(stage) {
    const stageData = wordsData[stage.toString()];
    if (!stageData || (!stageData.letters && !Array.isArray(stageData))) {
        showError('مرحله نامعتبر یا داده‌های JSON ناقص است!');
        return;
    }

    if (Array.isArray(stageData)) {
        const longestWord = stageData.reduce((a, b) => a.length > b.length ? a : b);
        stageData.letters = longestWord.split('');
        stageData.words = stageData;
    }

    foundWords = [];
    selectedLetters = [];
    document.getElementById('found-words').innerHTML = '<strong>کلمات پیدا شده:</strong>';
    document.getElementById('creative-words').innerHTML = '<strong>کلمات خلاقانه شما:</strong>';
    creativeWords.forEach(word => {
        document.getElementById('creative-words').innerHTML += `<div class="creative-word">${word}</div>`;
    });
    document.getElementById('current-word').innerText = '';
    document.getElementById('stage').innerText = stage;
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('hint-message').style.display = 'none';
    document.getElementById('timer-message').style.display = 'none';
    timeLeft = 120 + (stage * 10);
    document.getElementById('timer').innerText = timeLeft;

    const progress = (foundWords.length / stageData.words.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;

    const letters = stageData.letters.sort(() => Math.random() - 0.5);
    const lettersContainer = document.getElementById('letters');
    lettersContainer.innerHTML = '';
    letters.forEach((letter, index) => {
        const letterElement = document.createElement('div');
        letterElement.classList.add('letter');
        letterElement.innerText = letter;
        letterElement.style.animationDelay = `${index * 0.1}s`;
        letterElement.addEventListener('click', () => {
            selectLetter(letter, letterElement);
            playSound(clickSound);
        });
        lettersContainer.appendChild(letterElement);
    });

    lettersContainer.style.animation = 'popIn 0.7s ease';
    setTimeout(() => {
        lettersContainer.style.animation = '';
    }, 700);

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            document.getElementById('timer-message').innerText = '⏰ زمان تموم شد! دوباره تلاش کن!';
            document.getElementById('timer-message').style.display = 'block';
            playSound(successSound);
            setTimeout(() => {
                document.getElementById('timer-message').style.display = 'none';
                timeLeft = 120 + (currentStage * 10);
                document.getElementById('timer').innerText = timeLeft;
            }, 3000);
        }
    }, 1000);

    const githubLogo = document.querySelector('.github-logo');
    const hue = (stage * 30) % 360;
    githubLogo.style.filter = `hue-rotate(${hue}deg)`;
}

function selectLetter(letter, element) {
    if (element.classList.contains('selected')) {
        const index = selectedLetters.indexOf(letter);
        selectedLetters.splice(index, 1);
        element.classList.remove('selected');
    } else {
        selectedLetters.push(letter);
        element.classList.add('selected');
    }
    document.getElementById('current-word').innerText = selectedLetters.join('');
}

document.getElementById('submit-word').addEventListener('click', () => {
    const word = selectedLetters.join('');
    const stageData = wordsData[currentStage.toString()];
    const stageWords = stageData.words || stageData;
    if (word.length === 0) {
        document.getElementById('error-message').innerText = 'لطفاً کلمه‌ای انتخاب کنید!';
        document.getElementById('error-message').style.display = 'block';
        setTimeout(() => {
            document.getElementById('error-message').style.display = 'none';
        }, 2000);
        return;
    }
    if (stageWords.includes(word) && !foundWords.includes(word)) {
        foundWords.push(word);
        score += word.length * 10;
        document.getElementById('score').innerText = score;
        document.getElementById('found-words').innerHTML += `<div class="found-word">${word}</div>`;
        playSound(successSound);
        clearSelectedLetters();
        saveProgress();
        const progress = (foundWords.length / stageWords.length) * 100;
        document.getElementById('progress').style.width = `${progress}%`;
        if (foundWords.length === stageWords.length) {
            playSound(stageSound);
            currentStage++;
            saveProgress();
            if (wordsData[currentStage.toString()]) {
                startStage(currentStage);
            } else {
                endGame(true);
            }
        }
    } else if (!stageWords.includes(word) && word.length >= 2 && !creativeWords.includes(word)) {
        creativeWords.push(word);
        bonusScore += 1;
        document.getElementById('bonus-score').innerText = bonusScore;
        document.getElementById('creative-words').innerHTML += `<div class="creative-word">${word}</div>`;
        document.getElementById('hint-button').disabled = bonusScore < 5;
        saveProgress();
        clearSelectedLetters();
        document.getElementById('error-message').innerText = 'کلمه جدید! +1 امتیاز خلاقیت';
        document.getElementById('error-message').style.color = '#2196f3';
        document.getElementById('error-message').style.display = 'block';
        setTimeout(() => {
            document.getElementById('error-message').style.display = 'none';
            document.getElementById('error-message').style.color = '#f44336';
        }, 2000);
    } else {
        document.getElementById('error-message').innerText = 'کلمه نادرست یا قبلاً استفاده شده!';
        document.getElementById('error-message').style.display = 'block';
        setTimeout(() => {
            document.getElementById('error-message').style.display = 'none';
        }, 2000);
        clearSelectedLetters();
    }
});

document.getElementById('clear-word').addEventListener('click', clearSelectedLetters);

document.getElementById('hint-button').addEventListener('click', showHint);

document.getElementById('reset-game').addEventListener('click', () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید بازی را از ابتدا شروع کنید؟')) {
        restartGame();
    }
});

function clearSelectedLetters() {
    selectedLetters = [];
    document.getElementById('current-word').innerText = '';
    document.querySelectorAll('.letter').forEach(letter => letter.classList.remove('selected'));
}

function endGame(won = false) {
    clearInterval(timerInterval);
    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('final-score').innerText = score;
    document.getElementById('game-over-text').innerText = won ? '🔥 تبریک! همه مراحل تموم شد! 🎉' : 'بازی تمام شد! 😢';
}

function restartGame() {
    currentStage = 1;
    score = 0;
    bonusScore = 0;
    creativeWords = [];
    localStorage.clear();
    document.getElementById('score').innerText = score;
    document.getElementById('bonus-score').innerText = bonusScore;
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('hint-message').innerText = '';
    document.getElementById('timer-message').style.display = 'none';
    startStage(currentStage);
}

document.addEventListener('click', initializeSound, { once: true });
