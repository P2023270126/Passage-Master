/**
 * app.js - 核心邏輯與資料路由
 */

// 1. 設定區：請先填入你的 Google Sheet CSV 連結
const CSV_CONFIG = {
    "66": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTh9dDHpQwH8uY0QJjkjlQKTnLyQokNhIgjNUD8B3zM83_2BuHI2z0_Zg57gX1i9fJO25pSK4pOcZyW/pubhtml", 
    "22": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1SzwdMgvtmqJrVqawDMrf33UvA6b7C9PbCkjNaKqGLIOu-6tSGuD-EJJ1tBaTyCYMrLcJD_GSezQo/pubhtml"
};

// 2. 全域變數
let currentUser = "";
let gameData = { Spelling: [], Rearrange: [], Proofread: [], Cloze: [] };

// 管理拼字遊戲目前的狀態
let spellingState = {
    currentQuestionIndex: 0,
    correctCount: 0,
    questions: [],
    userAnswer: "" 
};

/**
 * 身份選擇函式 (由 index.html 的按鈕觸發)
 */
function selectUser(userId) {
    console.log("正在切換身份至:", userId);
    currentUser = userId;
    
    const url = CSV_CONFIG[userId];
    if (url && url !== "你的_JASPER_CSV_連結") {
        // 更新歡迎詞並開始抓取資料
        document.getElementById('welcome-msg').innerText = `Welcome, ${userId === '66' ? 'Jasper' : 'Jolie'}`;
        fetchData(url);
    } else {
        alert("錯誤：請在 app.js 中設定正確的 Google Sheet CSV 連結。");
    }
}

/**
 * 資料抓取函式
 */
function fetchData(url) {
    console.log("正在從此網址獲取資料:", url);
    
    // 使用 PapaParse 解析 CSV 資料
    Papa.parse(url, {
        download: true,
        header: true,
        complete: function(results) {
            console.log("資料解析成功:", results.data);
            processGameData(results.data);
            showScreen('menu-screen'); // 成功後顯示選單
        },
        error: function(err) {
            console.error("CSV 讀取錯誤:", err);
            alert("資料讀取失敗，請確認 Google Sheet 已「發佈到網路」並選擇 CSV 格式。");
        }
    });
}

/**
 * 將原始資料分類到各個遊戲模式
 */
function processGameData(rawData) {
    // 清空舊資料
    gameData = { Spelling: [], Rearrange: [], Proofread: [], Cloze: [] };
    
    rawData.forEach(row => {
        if (gameData[row.Mode]) {
            gameData[row.Mode].push({
                category: row.Category,
                context: row.Context,
                answer: row.Answer,
                options: row.Options ? row.Options.split('|') : []
            });
        }
    });
}

/**
 * 切換畫面函式
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

/**
 * 切換身份 (登出)
 */
function logout() {
    location.reload(); // 最徹底的重置方法
}

/**
 * 啟動拼字遊戲
 */
function startSpellingGame() {
    const questions = gameData.Spelling;
    if (questions.length === 0) {
        alert("找不到拼字題目，請檢查 Google Sheet 的 Mode 欄位是否為 Spelling");
        return;
    }
    
    // 初始化狀態
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
    const item = spellingState.questions[spellingState.currentQuestionIndex];
    const targetWord = item.answer.toLowerCase().trim();
    spellingState.userAnswer = ""; 
    
    // 1. 顯示句子並將目標單字挖空
    const displaySentence = item.context.replace(new RegExp(item.answer, 'gi'), "______");
    document.getElementById('spelling-sentence').innerText = displaySentence;
    
    // 2. 產生底線格子
    const displayArea = document.getElementById('spelling-word-display');
    displayArea.innerHTML = "";
    for (let i = 0; i < targetWord.length; i++) {
        const span = document.createElement('span');
        span.className = "letter-slot";
        span.innerText = "_";
        displayArea.appendChild(span);
    }
    
    // 3. 準備字母按鈕
    renderLetterButtons(targetWord, item.options);
}

/**
 * 產生亂序字母按鈕
 */
function renderLetterButtons(answer, extraOptions) {
    const container = document.getElementById('spelling-options');
    container.innerHTML = "";
    
    // 合併正確字母與干擾項 (Options 欄位以 | 分隔)
    let letters = answer.split('');
    if (extraOptions && extraOptions.length > 0) {
        letters = letters.concat(extraOptions);
    }
    
    // 隨機打亂字母
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
 * 處理字母點擊
 */
function handleLetterClick(char, btn, correctAnswer) {
    spellingState.userAnswer += char;
    const slots = document.querySelectorAll('.letter-slot');
    const currentIndex = spellingState.userAnswer.length - 1;
    
    if (slots[currentIndex]) {
        slots[currentIndex].innerText = char;
        slots[currentIndex].style.color = "#28a745";
    }

    btn.disabled = true; // 點過就不能再點

    // 檢查是否拼完
    if (spellingState.userAnswer.length === correctAnswer.length) {
        setTimeout(() => checkSpellingResult(correctAnswer), 300);
    }
}

function checkSpellingResult(correctAnswer) {
    if (spellingState.userAnswer === correctAnswer) {
        alert("太棒了！正確答案 ✨");
        spellingState.correctCount++;
    } else {
        alert(`可惜！正確答案是：${correctAnswer}`);
    }

    spellingState.currentQuestionIndex++;
    if (spellingState.currentQuestionIndex < spellingState.questions.length) {
        loadSpellingQuestion();
    } else {
        alert(`遊戲結束！你的得分：${spellingState.correctCount} / ${spellingState.questions.length}`);
        showScreen('menu-screen');
    }
}
