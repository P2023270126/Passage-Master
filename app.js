/**
 * 程式文件：app.js (修復版與 Spelling 邏輯)
 */

// ... (保留之前的變數與 CSV_CONFIG)

let spellingState = {
    currentQuestionIndex: 0,
    correctCount: 0,
    questions: []
};

/**
 * 修復：切換身份函式
 */
function logout() {
    // 重置所有全域狀態
    currentUser = "";
    gameData = { Spelling: [], Rearrange: [], Proofread: [], Cloze: [] };
    
    // 回到登入畫面
    showScreen('login-screen');
    
    // 清空歡迎文字，避免下次進入時殘留
    document.getElementById('welcome-msg').innerText = "";
}

/**
 * 啟動 Spelling 遊戲模式
 */
function startSpellingGame() {
    const questions = gameData.Spelling;
    if (questions.length === 0) {
        alert("目前沒有 Spelling 的題目資料。");
        return;
    }
    
    spellingState.questions = questions; // 可以加入 shuffleArray(questions) 隨機排序
    spellingState.currentQuestionIndex = 0;
    spellingState.correctCount = 0;
    
    showScreen('spelling-screen');
    loadSpellingQuestion();
}

/**
 * 載入單個拼字題目
 */
function loadSpellingQuestion() {
    const item = spellingState.questions[spellingState.currentQuestionIndex];
    const answer = item.answer.toLowerCase();
    
    // 處理句子顯示：將答案單字替換成底線，例如 "The apple is red" -> "The _____ is red"
    const displaySentence = item.context.replace(new RegExp(item.answer, 'gi'), "_____");
    document.getElementById('spelling-sentence').innerText = displaySentence;
    
    // 初始化拼字區域 (顯示底線)
    const wordDisplay = document.getElementById('spelling-word-display');
    wordDisplay.innerHTML = "";
    for(let i=0; i<answer.length; i++) {
        const span = document.createElement('span');
        span.className = "letter-slot";
        span.innerText = "_";
        wordDisplay.appendChild(span);
    }
    
    // 產生亂序字母選項 (包含正確字母與 Options 中的干擾項)
    const optionsContainer = document.getElementById('spelling-options');
    optionsContainer.innerHTML = "";
    
    // 合併正確字母與干擾項，並打亂
    let allLetters = answer.split('').concat(item.options);
    allLetters = shuffleArray(allLetters); 

    allLetters.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = "letter-btn";
        btn.innerText = letter;
        btn.onclick = () => handleLetterClick(letter, btn);
        optionsContainer.appendChild(btn);
    });
}

// 輔助工具：打亂陣列
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}
