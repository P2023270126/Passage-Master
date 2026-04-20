/**
 * 核心身份選擇函式
 * @param {string} userId - 用戶編號（66 或 22）
 */
function selectUser(userId) {
    console.log("已選擇用戶:", userId);
    // 呼叫先前寫好的載入邏輯
    const csvUrl = CSV_CONFIG[userId];
    if (csvUrl) {
        fetchData(csvUrl);
        document.getElementById('welcome-msg').innerText = `Welcome, ${userId === '66' ? 'Jasper' : 'Jolie'}`;
    } else {
        alert("找不到對應的 CSV 連結，請檢查 app.js 中的 CSV_CONFIG 設定。");
    }
}

// 確保之前的 CSV_CONFIG 依然存在
const CSV_CONFIG = {
    "66": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTh9dDHpQwH8uY0QJjkjlQKTnLyQokNhIgjNUD8B3zM83_2BuHI2z0_Zg57gX1i9fJO25pSK4pOcZyW/pubhtml",
    "22": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1SzwdMgvtmqJrVqawDMrf33UvA6b7C9PbCkjNaKqGLIOu-6tSGuD-EJJ1tBaTyCYMrLcJD_GSezQo/pubhtml"
};

/**
 * 程式文件：app.js (修復版與 Spelling 邏輯)
 */

// ... (保留之前的變數與 CSV_CONFIG)

let spellingState = {
    currentQuestionIndex: 0,
    correctCount: 0,
    questions: [],
    userAnswer: ""  // <--- 務必加入這行，用來儲存拼字進度
};

/**
 * 修復：切換身份函式
 * 位置：建議放在 selectUser 函式附近
 */
function logout() {
    // 直接重新載入網頁，這是最保險的「切換身份」方法
    location.reload();
}

/**
 * 啟動 Spelling 遊戲模式
 */
function startSpellingGame() {
    const questions = gameData.Spelling;
    if (questions.length === 0) {
        alert("目前沒有題目，請檢查 Google Sheet 資料！");
        return;
    }
    
    spellingState.questions = [...questions]; // 複製題目
    spellingState.currentQuestionIndex = 0;
    spellingState.correctCount = 0;
    
    showScreen('spelling-screen');
    loadSpellingQuestion();
}

/**
 * 載入單個題目並產生介面
 */
function loadSpellingQuestion() {
    const item = spellingState.questions[spellingState.currentQuestionIndex];
    const answer = item.answer.toLowerCase();
    spellingState.userAnswer = ""; // 重置學生答案
    
    // 1. 顯示句子並挖空
    const displaySentence = item.context.replace(new RegExp(item.answer, 'gi'), "_____");
    document.getElementById('spelling-sentence').innerText = displaySentence;
    
    // 2. 顯示底線格子
    renderWordDisplay(answer);
    
    // 3. 產生打亂的字母按鈕
    renderLetterButtons(item);
}

function renderWordDisplay(answer) {
    const container = document.getElementById('spelling-word-display');
    container.innerHTML = "";
    for (let i = 0; i < answer.length; i++) {
        const span = document.createElement('span');
        span.className = "letter-slot";
        span.innerText = "_";
        span.style.margin = "0 5px";
        span.style.borderBottom = "2px solid black";
        container.appendChild(span);
    }
}

function renderLetterButtons(item) {
    const container = document.getElementById('spelling-options');
    container.innerHTML = "";
    
    const answerLetters = item.answer.toLowerCase().split('');
    const extraLetters = item.options || [];
    let allLetters = answerLetters.concat(extraLetters);
    
    // 打亂字母順序
    allLetters.sort(() => Math.random() - 0.5);

    allLetters.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = "letter-btn";
        btn.innerText = letter;
        btn.onclick = () => handleLetterSelection(letter, btn, item.answer.toLowerCase());
        container.appendChild(btn);
    });
}

/**
 * 處理玩家點擊字母
 */
function handleLetterSelection(letter, btn, fullAnswer) {
    spellingState.userAnswer += letter;
    const currentIndex = spellingState.userAnswer.length - 1;
    
    // 更新畫面上的底線
    const slots = document.querySelectorAll('.letter-slot');
    if (slots[currentIndex]) {
        slots[currentIndex].innerText = letter;
    }
    
    btn.disabled = true; // 點過的按鈕不能再點
    btn.style.opacity = "0.5";

    // 檢查是否拼完
    if (spellingState.userAnswer.length === fullAnswer.length) {
        checkSpellingAnswer(fullAnswer);
    }
}

function checkSpellingAnswer(fullAnswer) {
    if (spellingState.userAnswer === fullAnswer) {
        alert("Correct! 🌟");
        spellingState.correctCount++;
    } else {
        alert("Wrong! The answer is: " + fullAnswer);
    }
    
    // 前往下一題或結束
    spellingState.currentQuestionIndex++;
    if (spellingState.currentQuestionIndex < spellingState.questions.length) {
        loadSpellingQuestion();
    } else {
        alert(`Game Over! Score: ${spellingState.correctCount}/${spellingState.questions.length}`);
        showScreen('menu-screen');
    }
}
