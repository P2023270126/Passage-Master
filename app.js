/**
 * app.js - 核心邏輯與資料路由
 */

// 1. 設定區：Google Sheet CSV 連結
const CSV_CONFIG = {
    "66": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTh9dDHpQwH8uY0QJjkjlQKTnLyQokNhIgjNUD8B3zM83_2BuHI2z0_Zg57gX1i9fJO25pSK4pOcZyW/pub?output=csv", 
    "22": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1SzwdMgvtmqJrVqawDMrf33UvA6b7C9PbCkjNaKqGLIOu-6tSGuD-EJJ1tBaTyCYMrLcJD_GSezQo/pub?output=csv"
};

// 2. 全域變數
let currentUser = "";
let gameData = { Spelling: [], Rearrange: [], Proofread: [], Cloze: [] };

let spellingState = {
    currentQuestionIndex: 0,
    correctCount: 0,
    questions: [],
    userAnswer: "" 
};

/**
 * 身份選擇函式
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

/**
 * 資料抓取函式
 */
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

/**
 * 處理原始 CSV 資料
 */
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

/**
 * 切換畫面
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

/**
 * 登出
 */
function logout() {
    location.reload();
}

/**
 * 啟動拼字遊戲
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

/**
 * 載入當前題目
 */
function loadSpellingQuestion() {
    // 隱藏回饋區塊
    document.getElementById('spelling-feedback').style.display = 'none';
    document.getElementById('spelling-options').style.pointerEvents = 'auto'; 
    
    const item = spellingState.questions[spellingState.currentQuestionIndex];
    const targetWord = item.answer.toLowerCase().trim();
    spellingState.userAnswer = ""; 
    
    // 顯示句子並挖空
    const displaySentence = item.context.replace(new RegExp(item.answer, 'gi'), "______");
    document.getElementById('spelling-sentence').innerText = displaySentence;
    
    // 產生底線格子
    const displayArea = document.getElementById('spelling-word-display');
    displayArea.innerHTML = "";
    for (let i = 0; i < targetWord.length; i++) {
        const span = document.createElement('span');
        span.className = "letter-slot";
        span.innerText = "_";
        displayArea.appendChild(span);
    }
    
    // 產生按鈕 (這裡只呼叫一次，結構才正確)
    renderLetterButtons(targetWord, item.options);
}

/**
 * 產生亂序字母按鈕
 */
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

/**
 * 處理點擊字母
 */
function handleLetterClick(char, btn, correctAnswer) {
    spellingState.userAnswer += char;
    const slots = document.querySelectorAll('.letter-slot');
    const currentIndex = spellingState.userAnswer.length - 1;
    
    if (slots[currentIndex]) {
        slots[currentIndex].innerText = char;
    }

    btn.disabled = true;

    if (spellingState.userAnswer.length === correctAnswer.length) {
        checkSpellingResult(correctAnswer);
    }
}

/**
 * 檢查結果
 */
function checkSpellingResult(correctAnswer) {
    const feedbackArea = document.getElementById('spelling-feedback');
    const feedbackText = document.getElementById('feedback-text');
    document.getElementById('spelling-options').style.pointerEvents = 'none';

    if (spellingState.userAnswer === correctAnswer) {
        feedbackText.innerText = "✅ Correct!";
        feedbackText.style.color = "#28a745";
        feedbackArea.style.borderColor = "#28a745";
        feedbackArea.style.backgroundColor = "#f9fff9";
        spellingState.correctCount++;
    } else {
        feedbackText.innerText = `❌  ${correctAnswer}`;
        feedbackText.style.color = "#dc3545";
        feedbackArea.style.borderColor = "#dc3545";
        feedbackArea.style.backgroundColor = "#fff9f9";
    }
    feedbackArea.style.display = 'block';
}

/**
 * 下一題按鈕邏輯
 */
function nextSpellingQuestion() {
    spellingState.currentQuestionIndex++;
    if (spellingState.currentQuestionIndex < spellingState.questions.length) {
        loadSpellingQuestion();
    } else {
        alert(`遊戲結束！你的得分：${spellingState.correctCount} / ${spellingState.questions.length}`);
        showScreen('menu-screen');
    }
}

/**
 * Rearrange 模式的狀態管理
 */
let rearrangeState = {
    currentQuestionIndex: 0,
    correctCount: 0,
    questions: [],
    userAnswerArray: [] // 儲存玩家點擊的單字順序
};

/**
 * 啟動重組句子遊戲
 */
function startRearrangeGame() {
    const questions = gameData.Rearrange;
    if (!questions || questions.length === 0) {
        alert("找不到重組句子題目，請檢查 Google Sheet 的 Mode 是否為 Rearrange");
        return;
    }
    
    rearrangeState.questions = [...questions];
    rearrangeState.currentQuestionIndex = 0;
    rearrangeState.correctCount = 0;
    
    showScreen('rearrange-screen');
    loadRearrangeQuestion();
}

/**
 * 載入重組句子題目
 */
function loadRearrangeQuestion() {
    // 重置畫面與狀態
    document.getElementById('rearrange-feedback').style.display = 'none';
    document.getElementById('rearrange-options').style.pointerEvents = 'auto';
    rearrangeState.userAnswerArray = [];
    
    const item = rearrangeState.questions[rearrangeState.currentQuestionIndex];
    const originalSentence = item.context.trim();
    
    // 顯示提示 (例如翻譯)
    document.getElementById('rearrange-hint').innerText = item.category || "請重組出正確的句子：";
    
    // 清空顯示區
    document.getElementById('rearrange-word-display').innerHTML = "";
    
    // 準備單字按鈕 (將句子拆開並打亂)
    let words = originalSentence.split(' ');
    // 隨機打亂
    words.sort(() => Math.random() - 0.5);
    
    const optionsContainer = document.getElementById('rearrange-options');
    optionsContainer.innerHTML = "";
    
    words.forEach((word, index) => {
        const btn = document.createElement('button');
        btn.className = "letter-btn"; // 沿用拼字模式的樣式
        btn.style.margin = "5px";
        btn.innerText = word;
        btn.onclick = () => handleWordClick(word, btn, originalSentence);
        optionsContainer.appendChild(btn);
    });
}

/**
 * 處理玩家點擊單字按鈕
 */
function handleWordClick(word, btn, originalSentence) {
    // 1. 將單字加入玩家答案陣列
    rearrangeState.userAnswerArray.push(word);
    
    // 2. 在顯示區呈現已選單字
    const displayArea = document.getElementById('rearrange-word-display');
    const wordSpan = document.createElement('span');
    wordSpan.innerText = word + " ";
    wordSpan.style.fontSize = "1.2rem";
    wordSpan.style.fontWeight = "bold";
    displayArea.appendChild(wordSpan);
    
    // 3. 停用該按鈕
    btn.disabled = true;
    btn.style.opacity = "0.5";
    
    // 4. 檢查是否所有單字都選完了
    const targetWords = originalSentence.split(' ');
    if (rearrangeState.userAnswerArray.length === targetWords.length) {
        checkRearrangeResult(originalSentence);
    }
}

/**
 * 檢查重組結果
 */
function checkRearrangeResult(correctSentence) {
    const playerSentence = rearrangeState.userAnswerArray.join(' ');
    const feedbackArea = document.getElementById('rearrange-feedback');
    const feedbackText = document.getElementById('rearrange-feedback-text');
    
    document.getElementById('rearrange-options').style.pointerEvents = 'none';

    if (playerSentence === correctSentence) {
        feedbackText.innerText = "✅ Excellent! Correct Sentence.";
        feedbackText.style.color = "#28a745";
        feedbackArea.style.borderColor = "#28a745";
        feedbackArea.style.backgroundColor = "#f9fff9";
        rearrangeState.correctCount++;
    } else {
        feedbackText.innerText = `❌  ${correctSentence}`;
        feedbackText.style.color = "#dc3545";
        feedbackArea.style.borderColor = "#dc3545";
        feedbackArea.style.backgroundColor = "#fff9f9";
    }
    
    feedbackArea.style.display = 'block';
}

/**
 * 下一題重組句子
 */
function nextRearrangeQuestion() {
    rearrangeState.currentQuestionIndex++;
    if (rearrangeState.currentQuestionIndex < rearrangeState.questions.length) {
        loadRearrangeQuestion();
    } else {
        alert(`重組練習結束！得分：${rearrangeState.correctCount} / ${rearrangeState.questions.length}`);
        showScreen('menu-screen');
    }
}
