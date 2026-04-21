/**
 * app.js - 完整整合版
 */

/**
 * 處理身份選擇
 * @param {string} user - 使用者名稱 (例如 'Jasper' 或 'Jolie')
 */
function selectUser(user) {
    console.log("Selected user:", user);
    
    // 1. 你可以在這裡記錄是誰在玩 (選填)
    // localStorage.setItem('currentPlayer', user);
    
    // 2. 切換到主選單畫面
    showScreen('menu-screen');
    
    // 3. 視情況彈出歡迎語 (增加趣味性)
    const welcomeMsg = user === 'Jasper' ? "Hi Jasper! Let's practice!" : "Hello Jolie! Ready to learn?";
    console.log(welcomeMsg);
}

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

// ... 之前的 spellingState, rearrangeState ...

let proofreadState = {
    currentQuestionIndex: 0,
    correctCount: 0,
    questions: [],
    targetWord: "",
    correctAnswer: ""
};

// [在這裡新增] Tense Master 的狀態
let tmState = {
    currentQuestionIndex: 0,
    correctCount: 0,
    questions: []
};

/**
 * 基礎功能：身份、資料抓取與畫面切換
 */
function selectUser(userId) {
    currentUser = userId;
    console.log("Selected user ID:", userId);
    
    const url = CSV_CONFIG[userId];
    if (url) {
        const name = userId === '66' ? 'Jasper' : 'Jolie';
        document.getElementById('welcome-msg').innerText = `Welcome, ${name}`;
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
    // 初始化各個模式的陣列
    gameData = { Spelling: [], Rearrange: [], Proofread: [], Cloze: [], TenseMaster: [] };

    rawData.forEach(row => {
        if (row.Mode) {
            const mode = row.Mode.trim();
            if (gameData[mode]) {
                // 建立基礎物件
                let item = {
                    category: row.Category || "",
                    context: row.Context || "",
                    answer: row.Answer || ""
                };

                // 強制抓取所有可能的欄位，避免漏掉
                item.correction = row.Correction || row.correction || "";
                item.options = row.Options || row.options || "";
                item.correct_verb = row.Correct_Verb || row.correct_verb || "";

                gameData[mode].push(item);
            }
        }
    });
    console.log("Data loaded successfully:", gameData); // 在控制台確認資料是否有抓到
}
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

function logout() {
    location.reload();
}

// 在 Spelling 遊戲開始時
function startSpellingGame() {
    const questions = gameData.Spelling;
    if (questions.length === 0) return alert("找不到拼字題目！");

    updateCategoryDropdown('Spelling'); 

    // 打亂拼字題目順序
    spellingState.questions = shuffleArray([...questions]); 
    
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

// 在 Rearrange 遊戲開始時
function startRearrangeGame() {
    const questions = gameData.Rearrange;
    if (!questions || questions.length === 0) return alert("找不到重組題目！");

    updateCategoryDropdown('Rearrange');

    // 打亂重組題目順序
    rearrangeState.questions = shuffleArray([...questions]);

    rearrangeState.currentQuestionIndex = 0;
    rearrangeState.correctCount = 0;
    showScreen('rearrange-screen');
    loadRearrangeQuestion();
}

/**
 * Tense Master 模式邏輯 - 修正整合版
 */
function startTenseMaster() {
    const questions = gameData.TenseMaster || []; 
    if (questions.length === 0) return alert("找不到題目！");

    // 將複製出來的題目陣列打亂順序
    tmState.questions = shuffleArray([...questions]); 
    
    tmState.currentQuestionIndex = 0;
    tmState.correctCount = 0;
    showScreen('tense-master-screen');
    loadTenseQuestion();
}

function loadTenseQuestion() {
    const q = tmState.questions[tmState.currentQuestionIndex];
    
    // 1. 初始化介面：顯示 Step 1，隱藏 Step 2
    document.getElementById('tm-step1-container').style.display = 'block';
    document.getElementById('tm-step2-container').style.display = 'none';
    
    const container = document.getElementById('tm-sentence-container');
    container.innerHTML = '';
    document.getElementById('tm-marker-msg').innerHTML = '';
    document.getElementById('tm-continue-btn').style.display = 'none';

    // 2. 建立單字按鈕 (Step 1: 選時態關鍵字)
    const words = q.context.split(' ');
    words.forEach(word => {
        const btn = document.createElement('button');
        btn.innerText = word;
        btn.className = 'word-btn'; // 確保 CSS 中有設定 word-btn 的大字體樣式
        btn.onclick = () => checkMarker(btn, word, q.answer);
        container.appendChild(btn);
    });
}

function checkMarker(btn, word, correctAnswer) {
    const msg = document.getElementById('tm-marker-msg');
    const continueBtn = document.getElementById('tm-continue-btn');
    const allBtns = document.querySelectorAll('#tm-sentence-container .word-btn');

    const cleanWord = word.toLowerCase().replace(/[?!.,]/g, '');
    const cleanCorrect = correctAnswer.toLowerCase().trim();

    if (cleanWord === cleanCorrect) {
        btn.style.backgroundColor = "#eaffea";
        btn.style.borderColor = "#28a745";
        msg.innerHTML = '<span style="color:#28a745; font-size: 1.5rem; font-weight: bold;">✅ Correct! That is the marker!</span>';
    } else {
        btn.style.backgroundColor = "#ffeaea";
        btn.style.borderColor = "#dc3545";
        msg.innerHTML = `<span style="color:#dc3545; font-size: 1.5rem; font-weight: bold;">❌ Oops! The marker is "${correctAnswer}".</span>`;
        // 將正確的按鈕標示出來給 Jasper 看
        allBtns.forEach(b => {
            if(b.innerText.toLowerCase().replace(/[?!.,]/g, '') === cleanCorrect) {
                b.style.border = "3px solid #28a745";
            }
        });
    }

    allBtns.forEach(b => b.disabled = true);
    continueBtn.style.display = 'inline-block';
}

function goToStep2() {
    const q = tmState.questions[tmState.currentQuestionIndex];
    
    // 1. 顯示容器
    document.getElementById('tm-step1-container').style.display = 'none';
    document.getElementById('tm-step2-container').style.display = 'block';
    
    // 2. 更新上方參考句子 (深綠色、加粗、放大)
    const refArea = document.getElementById('tm-context-reference');
    if (refArea) {
        refArea.innerHTML = `
            <p style="color: #1a5928; font-weight: bold; font-size: 2.0rem; margin-bottom: 20px; background-color: #f0f9f1; padding: 10px; border-radius: 8px; display: inline-block;">
                ${q.context}
            </p>`;
    }

    // 3. 核心修正：確保 Step 2 的句子與選項容器存在並填入內容
    const clozeContainer = document.getElementById('tm-cloze-sentence');
    const optionsContainer = document.getElementById('tm-options-container');
    const feedback = document.getElementById('tm-final-feedback');
    const nextBtn = document.getElementById('tm-next-btn');

    // 如果 HTML 裡沒這些 ID，這行會報錯，所以我們要確保它們都有顯示
    if (clozeContainer && optionsContainer) {
        clozeContainer.innerText = q.correction || ""; 
        optionsContainer.innerHTML = '';
        if (feedback) feedback.innerHTML = '';
        if (nextBtn) nextBtn.style.display = 'none';

        // 4. 產生選項按鈕
        const rawOptions = q.options || "";
        const opts = rawOptions.split('|').map(o => o.trim()).filter(o => o !== "");
        opts.sort(() => Math.random() - 0.5);

        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = 'option-btn'; 
            btn.onclick = () => checkTMAnswer(btn, opt, q.correct_verb);
            optionsContainer.appendChild(btn);
        });
    } else {
        console.error("找不到 tm-cloze-sentence 或 tm-options-container！請檢查 HTML。");
    }
}

function checkTMAnswer(clickedBtn, selectedValue, correctAnswer) {
    const q = tmState.questions[tmState.currentQuestionIndex];
    const feedback = document.getElementById('tm-final-feedback');
    const nextBtn = document.getElementById('tm-next-btn');
    
    const allBtns = document.querySelectorAll('#tm-options-container .option-btn');
    allBtns.forEach(b => b.disabled = true);

    const cleanSelected = selectedValue.trim().toLowerCase();
    const cleanCorrect = (correctAnswer || "").trim().toLowerCase();
    
    // 組合完整句子播放語音
    const fullSentence = q.correction.replace('___', (correctAnswer || "____"));

    if (cleanSelected === cleanCorrect) {
        clickedBtn.style.backgroundColor = "#28a745";
        clickedBtn.style.color = "white";
        feedback.innerHTML = `<div style="color:#28a745; font-size:1.8rem; font-weight:bold; margin:15px 0;">✅ Excellent!</div>`;
        tmState.correctCount++;
    } else {
        clickedBtn.style.backgroundColor = "#dc3545";
        clickedBtn.style.color = "white";
        feedback.innerHTML = `<div style="color:#dc3545; font-size:1.8rem; font-weight:bold; margin:15px 0;">❌ Focus on the tense!</div>
                              <div style="font-size:1.2rem;">The answer is: <b style="color:#28a745">${correctAnswer}</b></div>`;
    }

    speak(fullSentence); // 播放正確句子的聲音
    nextBtn.style.display = 'inline-block';
}

function nextTenseQuestion() {
    tmState.currentQuestionIndex++;
    if (tmState.currentQuestionIndex < tmState.questions.length) {
        loadTenseQuestion();
    } else {
        alert(`Finished! Your score: ${tmState.correctCount} / ${tmState.questions.length}`);
        showScreen('menu-screen');
    }
}

// 萬用的 speak 函式 (如果還沒定義的話)
function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
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
 * Proofread 模式邏輯
 */
function startProofreadGame() {
    const questions = gameData.Proofread;
    if (!questions || questions.length === 0) return alert("找不到除錯題目！");
    
    updateCategoryDropdown('Proofread');
    
    proofreadState.questions = [...questions];
    proofreadState.currentQuestionIndex = 0;
    proofreadState.correctCount = 0;
    showScreen('proofread-screen');
    loadProofreadQuestion();
}

function loadProofreadQuestion() {
    const item = proofreadState.questions[proofreadState.currentQuestionIndex];
    const displayArea = document.getElementById('proofread-sentence-display');
    const inputArea = document.getElementById('correction-input-area');
    const feedback = document.getElementById('proofread-feedback');
    
    inputArea.style.display = 'none';
    feedback.style.display = 'none';
    displayArea.innerHTML = "";
    document.getElementById('user-correction').value = "";

    // 將句子拆解成單字，並讓每個字都能點擊
    const words = item.context.split(' ');
    words.forEach(word => {
        const span = document.createElement('span');
        span.innerText = word + " ";
        span.className = "clickable-word";
        span.onclick = () => selectWord(word, span, item.answer, item.correction);
        displayArea.appendChild(span);
    });
}

function selectWord(word, element, wrongWord, rightWord) {
    document.querySelectorAll('.clickable-word').forEach(s => s.style.backgroundColor = "transparent");
    element.style.backgroundColor = "#ffeeba";
    
    document.getElementById('correction-input-area').style.display = 'block';
    // 清除標點符號方便對齊
    const cleanedWord = word.trim().replace(/[.,!?;:]/g, "");
    document.getElementById('selected-wrong-word').innerText = cleanedWord;
    
    proofreadState.targetWord = cleanedWord;
    proofreadState.correctAnswer = rightWord;
}

function checkCorrection() {
    const userInp = document.getElementById('user-correction').value.trim().toLowerCase();
    const feedbackText = document.getElementById('proofread-feedback-text');
    const item = proofreadState.questions[proofreadState.currentQuestionIndex];
    
    // 安全地讀取答案，避免 undefined 錯誤
    const targetWrong = (item.answer || "").toLowerCase();
    const targetRight = (item.correction || "").toLowerCase();

    if (proofreadState.targetWord.toLowerCase() === targetWrong && userInp === targetRight) {
        feedbackText.innerText = "✅ Excellent! You fixed it!";
        feedbackText.style.color = "#28a745";
        proofreadState.correctCount++;
    } else {
        // 如果顯示 undefined，就代表 item.correction 沒抓到資料
        feedbackText.innerText = `❌ The error was "${item.answer}" -> "${item.correction || 'Missing Data'}".`;
        feedbackText.style.color = "#dc3545";
    }
    document.getElementById('proofread-feedback').style.display = 'block';
}

function nextProofreadQuestion() {
    proofreadState.currentQuestionIndex++;
    if (proofreadState.currentQuestionIndex < proofreadState.questions.length) {
        loadProofreadQuestion();
    } else {
        alert(`Game Over! Score: ${proofreadState.correctCount} / ${proofreadState.questions.length}`);
        showScreen('menu-screen');
    }
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
 * 切換至下一個重組題目
 */
function nextRearrangeQuestion() {
    // 1. 增加題目索引數值
    rearrangeState.currentQuestionIndex++;

    // 2. 判斷是否還有下一題
    if (rearrangeState.currentQuestionIndex < rearrangeState.questions.length) {
        // 如果有下一題，呼叫原本的載入函式
        // 這會自動重置按鈕顯示、清空顯示區與準備新單字
        loadRearrangeQuestion();
    } else {
        // 如果題目全部做完，顯示結算視窗並返回主選單
        alert(`恭喜完成！重組練習得分：${rearrangeState.correctCount} / ${rearrangeState.questions.length}`);
        showScreen('menu-screen');
    }
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

// 1. 用來更新下拉選單內容的函式
function updateCategoryDropdown(mode) {
    const dropdown = document.getElementById(`${mode.toLowerCase()}-category-filter`);
    if (!dropdown) return;

    // 取得該模式下所有的類別並去重
    const categories = [...new Set(gameData[mode].map(item => item.category))];
    dropdown.innerHTML = '<option value="all">全部類別</option>';
    
    categories.forEach(cat => {
        if (cat) {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            dropdown.appendChild(opt);
        }
    });
}

// 2. 用來處理玩家切換類別時的篩選邏輯
function filterByCategory(mode) {
    const dropdown = document.getElementById(`${mode.toLowerCase()}-category-filter`);
    const selectedCat = dropdown.value;
    let filteredQuestions = [...gameData[mode]];
    
    if (selectedCat !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.category === selectedCat);
    }

    if (mode === 'Rearrange') {
        rearrangeState.questions = filteredQuestions;
        rearrangeState.currentQuestionIndex = 0;
        rearrangeState.correctCount = 0;
        loadRearrangeQuestion();
    } else if (mode === 'Spelling') {
        spellingState.questions = filteredQuestions;
        spellingState.currentQuestionIndex = 0;
        spellingState.correctCount = 0;
        loadSpellingQuestion();
    } else if (mode === 'Proofread') {
        proofreadState.questions = filteredQuestions;
        proofreadState.currentQuestionIndex = 0;
        proofreadState.correctCount = 0;
        loadProofreadQuestion();
    } else if (mode === 'TenseMaster') { // [新增這一段]
        tmState.questions = filteredQuestions;
        tmState.currentQuestionIndex = 0;
        tmState.correctCount = 0;
        loadTenseQuestion();
    }
}

// 隨機打亂陣列的工具函式
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
