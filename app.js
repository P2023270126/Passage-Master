/**
 * app.js - 完整整合版
 */

// 1. 設定區
const CSV_CONFIG = {
    "66": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTh9dDHpQwH8uY0QJjkjlQKTnLyQokNhIgjNUD8B3zM83_2BuHI2z0_Zg57gX1i9fJO25pSK4pOcZyW/pub?output=csv", 
    "22": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1SzwdMgvtmqJrVqawDMrf33UvA6b7C9PbCkjNaKqGLIOu-6tSGuD-EJJ1tBaTyCYMrLcJD_GSezQo/pub?output=csv"
};

// 2. 全域變數
let currentUser = "";
let gameData = { Spelling: [], Rearrange: [], Proofread: [], Cloze: [] };
let currentCorrectSentence = ""; // 用於語音播放

// 遊戲狀態
let spellingState = {
    currentQuestionIndex: 0,
    correctCount: 0,
    questions: [],
    userAnswer: "" 
};

let rearrangeState = {
    currentQuestionIndex: 0,
    correctCount: 0,
    questions: [],
    userAnswerArray: []
};

/**
 * 基礎功能：身份、資料抓取與畫面切換
 */
function selectUser(userId) {
    currentUser = userId;
    const url = CSV_CONFIG[userId];
    if (url) {
        document.getElementById('welcome-msg').innerText = `Welcome, ${userId === '66' ? 'Jasper' : 'Jolie'}`;
        fetchData(url);
    } else {
        alert("錯誤：找不到設定的 URL");
    }
}

function fetchData(url) {
    Papa.parse(url, {
        download: true,
        header: true,
        complete: function(results) {
            processGameData(results.data);
            showScreen('menu-screen');
        },
        error: function(err) {
            console.error("CSV 讀取錯誤:", err);
        }
    });
}

function processGameData(rawData) {
    gameData = { Spelling: [], Rearrange: [], Proofread: [], Cloze: [] };
    rawData.forEach(row => {
        if (row.Mode) {
            const mode = row.Mode.trim(); 
            if (gameData[mode]) {
                gameData[mode].push({
                    category: row.Category,
                    context: row.Context,
                    answer: row.Answer,
                    options: row.Options ? row.Options.split('|') : []
                });
            }
        }
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

function logout() {
    location.reload();
}

/**
 * Spelling 遊戲邏輯
 */
function startSpellingGame() {
    const questions = gameData.Spelling;
    if (questions.length === 0) {
        alert("找不到拼字題目！");
        return;
    }
    spellingState.questions = [...questions]; 
    spellingState.currentQuestionIndex = 0;
    spellingState.correctCount = 0;
    showScreen('spelling-screen');
    loadSpellingQuestion();
}

function loadSpellingQuestion() {
    document.getElementById('spelling-feedback').style.display = 'none';
    document.getElementById('spelling-options').style.pointerEvents = 'auto'; 
    const item = spellingState.questions[spellingState.currentQuestionIndex];
    const targetWord = item.answer.toLowerCase().trim();
    spellingState.userAnswer = ""; 
    const displaySentence = item.context.replace(new RegExp(item.answer, 'gi'), "______");
    document.getElementById('spelling-sentence').innerText = displaySentence;
    const displayArea = document.getElementById('spelling-word-display');
    displayArea.innerHTML = "";
    for (let i = 0; i < targetWord.length; i++) {
        const span = document.createElement('span');
        span.className = "letter-slot";
        span.innerText = "_";
        displayArea.appendChild(span);
    }
    renderLetterButtons(targetWord, item.options);
}

function renderLetterButtons(answer, extraOptions) {
    const container = document.getElementById('spelling-options');
    container.innerHTML = "";
    let letters = answer.split('');
    if (extraOptions && extraOptions.length > 0) {
        letters = letters.concat(extraOptions);
    }
    letters.sort(() => Math.random() - 0.5);
    letters.forEach(char => {
        const btn = document.createElement('button');
        btn.className = "letter-btn";
        btn.innerText = char;
        btn.onclick = () => handleLetterClick(char, btn, answer);
        container.appendChild(btn);
    });
}

function handleLetterClick(char, btn, correctAnswer) {
    spellingState.userAnswer += char;
    const slots = document.querySelectorAll('.letter-slot');
    const currentIndex = spellingState.userAnswer.length - 1;
    if (slots[currentIndex]) slots[currentIndex].innerText = char;
    btn.disabled = true;
    if (spellingState.userAnswer.length === correctAnswer.length) {
        checkSpellingResult(correctAnswer);
    }
}

function checkSpellingResult(correctAnswer) {
    const feedbackArea = document.getElementById('spelling-feedback');
    const feedbackText = document.getElementById('feedback-text');
    document.getElementById('spelling-options').style.pointerEvents = 'none';
    if (spellingState.userAnswer === correctAnswer) {
        feedbackText.innerText = "✅ Correct!";
        feedbackText.style.color = "#28a745";
        spellingState.correctCount++;
    } else {
        feedbackText.innerText = `❌ ${correctAnswer}`;
        feedbackText.style.color = "#dc3545";
    }
    feedbackArea.style.display = 'block';
}

function nextSpellingQuestion() {
    spellingState.currentQuestionIndex++;
    if (spellingState.currentQuestionIndex < spellingState.questions.length) {
        loadSpellingQuestion();
    } else {
        alert(`遊戲結束！得分：${spellingState.correctCount} / ${spellingState.questions.length}`);
        showScreen('menu-screen');
    }
}

/**
 * Rearrange 遊戲邏輯 (整合新功能)
 */
function startRearrangeGame() {
    const questions = gameData.Rearrange;
    if (!questions || questions.length === 0) {
        alert("找不到重組題目！");
        return;
    }
    rearrangeState.questions = [...questions];
    rearrangeState.currentQuestionIndex = 0;
    rearrangeState.correctCount = 0;
    showScreen('rearrange-screen');
    loadRearrangeQuestion();
}

/**
 * Rearrange 模式的狀態管理與功能
 */

// 確保這是在檔案頂部的全域變數
// let currentCorrectSentence = ""; 

/**
 * 載入重組句子題目
 */
function loadRearrangeQuestion() {
    // 1. 重置畫面與狀態
    document.getElementById('rearrange-feedback').style.display = 'none';
    document.getElementById('rearrange-options').style.display = 'flex'; // 確保選項區顯示
    document.getElementById('rearrange-undo-container').style.display = 'block'; // 確保退回按鈕顯示
    document.getElementById('rearrange-options').style.pointerEvents = 'auto';
    
    rearrangeState.userAnswerArray = [];
    
    const item = rearrangeState.questions[rearrangeState.currentQuestionIndex];
    
    // 同步正確答案，供語音播放與判斷使用
    currentCorrectSentence = item.context.trim();
    
    document.getElementById('rearrange-hint').innerText = item.category || "請重組句子：";
    
    // 清空並重新渲染顯示區
    renderRearrangeDisplay();
    
    // 準備打亂的單字按鈕
    let words = currentCorrectSentence.split(' ');
    words.sort(() => Math.random() - 0.5);
    
    const optionsContainer = document.getElementById('rearrange-options');
    optionsContainer.innerHTML = "";
    
    words.forEach((word) => {
        const btn = document.createElement('button');
        btn.className = "letter-btn"; 
        btn.innerText = word;
        btn.onclick = () => handleWordClick(word, btn);
        optionsContainer.appendChild(btn);
    });
}

/**
 * 處理玩家點擊單字按鈕
 * @param {string} word - 點擊的單字
 * @param {HTMLElement} btn - 被點擊的按鈕元素
 */
function handleWordClick(word, btn) {
    // 1. 將單字加入玩家答案陣列
    rearrangeState.userAnswerArray.push(word);
    
    // 2. 更新顯示區 (呼叫你已有的渲染函式)
    renderRearrangeDisplay();
    
    // 3. 停用該按鈕並改變透明度，讓玩家知道已選過
    btn.disabled = true;
    btn.style.opacity = "0.3";
    
    // 4. 檢查是否所有單字都選完了
    const targetWords = currentCorrectSentence.split(' ');
    if (rearrangeState.userAnswerArray.length === targetWords.length) {
        checkRearrangeResult();
    }
}

/**
 * 檢查重組結果
 */
function checkRearrangeResult() {
    const playerSentence = rearrangeState.userAnswerArray.join(' ');
    const feedbackArea = document.getElementById('rearrange-feedback');
    const feedbackText = document.getElementById('rearrange-feedback-text');
    
    // 停止選項區的所有互動
    document.getElementById('rearrange-options').style.pointerEvents = 'none';

    // [核心修正] 無論對錯，一旦檢查結果，就隱藏「退回」按鈕和「選項」區
    document.getElementById('rearrange-undo-container').style.display = 'none';
    document.getElementById('rearrange-options').style.display = 'none';

    if (playerSentence === currentCorrectSentence) {
        feedbackText.innerText = "✅ Excellent!";
        feedbackText.style.color = "#28a745";
        feedbackArea.style.borderColor = "#28a745";
        rearrangeState.correctCount++;
    } else {
        feedbackText.innerText = "❌ " + currentCorrectSentence;
        feedbackText.style.color = "#dc3545";
        feedbackArea.style.borderColor = "#dc3545";
    }
    
    feedbackArea.style.display = 'block';
}

/**
 * 退回一步的功能
 */
function undoLastWord() {
    if (rearrangeState.userAnswerArray.length === 0) return;

    const removedWord = rearrangeState.userAnswerArray.pop();
    renderRearrangeDisplay();

    // 恢復對應的按鈕狀態
    const optionButtons = document.querySelectorAll('#rearrange-options .letter-btn');
    for (let btn of optionButtons) {
        if (btn.innerText === removedWord && btn.disabled) {
            btn.disabled = false;
            btn.style.opacity = "1";
            break; 
        }
    }
}

/**
 * 語音播放功能
 */
function speakSentence() {
    if (!currentCorrectSentence) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentCorrectSentence);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
}

// 輔助渲染函式
function renderRearrangeDisplay() {
    const displayArea = document.getElementById('rearrange-word-display');
    displayArea.innerHTML = ""; 
    rearrangeState.userAnswerArray.forEach(word => {
        const span = document.createElement('span');
        span.innerText = word;
        span.className = "selected-word"; 
        displayArea.appendChild(span);
    });
}
