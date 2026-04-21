/**
 * app.js - 2026 最終整合版 (昨晚穩定版 + Tense Master)
 */

// 1. 設定區
const CSV_CONFIG = {
    "66": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTh9dDHpQwH8uY0QJjkjlQKTnLyQokNhIgjNUD8B3zM83_2BuHI2z0_Zg57gX1i9fJO25pSK4pOcZyW/pub?output=csv", 
    "22": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1SzwdMgvtmqJrVqawDMrf33UvA6b7C9PbCkjNaKqGLIOu-6tSGuD-EJJ1tBaTyCYMrLcJD_GSezQo/pub?output=csv"
};

// 2. 全域變數
let currentUser = "";
let gameData = { Spelling: [], Rearrange: [], Proofread: [], Cloze: [], TenseMaster: [] };
let currentCorrectSentence = "";

let spellingState = { currentQuestionIndex: 0, correctCount: 0, questions: [], userAnswer: "" };
let rearrangeState = { currentQuestionIndex: 0, correctCount: 0, questions: [], userAnswerArray: [] };
let proofreadState = { currentQuestionIndex: 0, correctCount: 0, questions: [], targetWord: "", correctAnswer: "" };
let tmState = { currentQuestionIndex: 0, correctCount: 0, questions: [], selectedMarker: false };

// --- 基礎功能 ---
function selectUser(userId) {
    currentUser = userId;
    const url = CSV_CONFIG[userId];
    if (url) {
        document.getElementById('welcome-msg').innerText = `Welcome, ${userId === '66' ? 'Jasper' : 'Jolie'}`;
        fetchData(url);
    }
}

function fetchData(url) {
    Papa.parse(url, {
        download: true,
        header: true,
        complete: function(results) {
            processGameData(results.data);
            showScreen('menu-screen');
        }
    });
}

function processGameData(rawData) {
    gameData = { Spelling: [], Rearrange: [], Proofread: [], Cloze: [], TenseMaster: [] };
    rawData.forEach(row => {
        if (row.Mode) {
            const mode = row.Mode.trim();
            if (gameData[mode]) {
                // 通用的資料處理
                const item = {
                    category: row.Category,
                    context: row.Context,
                    // 為了相容 Spelling，我們保留 answer 屬性
                    answer: row.Answer || row.Correction, 
                    
                    // 專屬 Tense Master 的屬性
                    marker: row.Answer,          // Column D
                    fullSentence: row.Correction, // Column E
                    verbOptions: row.Marker,      // Column F
                    finalAnswer: row.Correct_Verb // Column G
                };
                
                gameData[mode].push(item);
            }
        }
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

function logout() { location.reload(); }

// --- Tense Master 邏輯 (新加入) ---
function startTenseMaster() {
    const questions = gameData.TenseMaster || [];
    if (questions.length === 0) return alert("No Tense Master data!");
    tmState.questions = [...questions].sort(() => Math.random() - 0.5);
    tmState.currentQuestionIndex = 0;
    tmState.correctCount = 0;
    showScreen('tense-master-screen');
    loadTenseQuestion();
}

function loadTenseQuestion() {
    const q = tmState.questions[tmState.currentQuestionIndex];
    const container = document.getElementById('tm-sentence-container');
    const feedback = document.getElementById('tm-feedback');
    const optionsCont = document.getElementById('tm-options');
    
    // 初始化畫面
    feedback.innerText = "";
    tmState.selectedMarker = false;
    document.getElementById('tm-step2-area').style.display = "none";
    document.getElementById('tm-next-btn').style.display = "none";
    document.getElementById('tm-instruction').innerText = "Step 1: Click the Time Marker (時態提示詞)";

    container.innerHTML = `
        <div id="tm-question-line" style="margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;"></div>
        <div id="tm-fill-blank-line" style="font-weight: bold; color: #ccc;">${q.fullSentence}</div>
    `;

    const questionLine = document.getElementById('tm-question-line');
    const targetMarker = (q.marker || "").trim().toLowerCase();

    q.context.split(' ').forEach(word => {
        const cleanWord = word.replace(/[.,!?;:]/g, "").trim().toLowerCase();
        const span = document.createElement('span');
        span.innerText = word + " ";
        span.className = "tm-marker";
        span.onclick = () => {
            if (tmState.selectedMarker) return; // 只能點一次
            tmState.selectedMarker = true;

            // 視覺反饋
            if (cleanWord === targetMarker) {
                span.classList.add('selected'); // 變藍色
                feedback.innerText = "🎯 Well found! Now choose the verb.";
            } else {
                span.style.color = "orange"; // 點錯字變橙色，但依然繼續
                feedback.innerText = `💡 The marker was actually "${q.marker}". Let's choose the verb!`;
            }

            // 無論對錯，1秒後顯示 Step 2
            setTimeout(() => {
                showTmOptions(q);
                document.getElementById('tm-fill-blank-line').style.color = "#2c3e50"; // 點亮填空句
            }, 800);
        };
        questionLine.appendChild(span);
    });
}

function showTmOptions(q) {
    const optionsCont = document.getElementById('tm-options');
    const feedback = document.getElementById('tm-feedback');
    optionsCont.innerHTML = "";
    document.getElementById('tm-step2-area').style.display = "block";
    document.getElementById('tm-instruction').innerText = "Step 2: Select the correct Verb Form";

    const opts = (q.verbOptions || "").split('|').map(s => s.trim());
    
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "letter-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            if (opt === q.finalAnswer) {
                feedback.innerText = "✅ Perfect! Listen to the sentence.";
                feedback.style.color = "green";
                
                // 替換底線並朗讀
                const finalSentence = q.fullSentence.replace("___", q.finalAnswer);
                speak(finalSentence); // 呼叫朗讀功能
                // 將網頁上的底線句子換成正確的完整句子
                document.getElementById('tm-fill-blank-line').innerText = finalSentence;
                tmState.correctCount++;
                document.getElementById('tm-next-btn').style.display = "block";
                optionsCont.style.pointerEvents = "none";
            } else {
                feedback.innerText = "❌ Try another form!";
                feedback.style.color = "red";
            }
        };
        optionsCont.appendChild(btn);
    });
}
    optionsCont.style.pointerEvents = "auto";
}

function showTmOptions(q) {
    const optionsCont = document.getElementById('tm-options');
    optionsCont.innerHTML = "";
    document.getElementById('tm-step2-area').style.display = "block";
    document.getElementById('tm-instruction').innerText = "Step 2: Choose the Correct Verb";

    // 關鍵修正：用返你在 processGameData 定義嘅名 (假設係 verbOptions)
    // 並且用 "|" 嚟 split，因為你 Sheet 入面係用 "|"
    const rawOptions = q.verbOptions || ""; 
    const opts = rawOptions.split('|').map(s => s.trim());

    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "letter-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            const feedback = document.getElementById('tm-feedback');
            // 關鍵修正：對比 finalAnswer (即係 Sheet 嘅 G 欄)
            if (opt === q.finalAnswer) {
                feedback.innerText = "✅ Perfect! Correct Tense!";
                feedback.style.color = "green";
                tmState.correctCount++;
            } else {
                feedback.innerText = `❌ Wrong. The answer is "${q.finalAnswer}"`;
                feedback.style.color = "red";
            }
            document.getElementById('tm-next-btn').style.display = "block";
            optionsCont.style.pointerEvents = "none";
        };
        optionsCont.appendChild(btn);
    });
    optionsCont.style.pointerEvents = "auto";
}

function nextTenseQuestion() {
    tmState.currentQuestionIndex++;
    if (tmState.currentQuestionIndex < tmState.questions.length) {
        loadTenseQuestion();
    } else {
        alert(`Finished! Score: ${tmState.correctCount}/${tmState.questions.length}`);
        showScreen('menu-screen');
    }
}

// --- 以下保留你原本所有穩定的邏輯 (Spelling, Rearrange, Proofread) ---

function startSpellingGame() {
    const questions = gameData.Spelling;
    if (questions.length === 0) return alert("找不到拼字題目！");
    
    updateCategoryDropdown('Spelling');
    
    // --- 修改這部分：將題目進行亂序處理 ---
    // [...questions] 是為了複製一份資料，不影響原始資料順序
    spellingState.questions = [...questions].sort(() => Math.random() - 0.5);
    // ------------------------------------

    spellingState.currentQuestionIndex = 0;
    spellingState.correctCount = 0;
    showScreen('spelling-screen');
    loadSpellingQuestion();
}

function loadSpellingQuestion() {
    document.getElementById('spelling-feedback').style.display = 'none';
    document.getElementById('spelling-options').style.pointerEvents = 'auto'; 
    const item = spellingState.questions[spellingState.currentQuestionIndex];
    // 檢查答案來源 (D 欄 Answer 或 E 欄 Correction)
    const rawAnswer = item.answer || item.correction || "";
    
    if (rawAnswer === "") {
        document.getElementById('spelling-sentence').innerText = "Data Missing!";
        return;
    }

    const targetWord = rawAnswer.toLowerCase().trim();
    spellingState.userAnswer = "";

    // 顯示句子並替換單字為底線
    const displaySentence = item.context.replace(new RegExp(rawAnswer, 'gi'), "_______");
    document.getElementById('spelling-sentence').innerText = displaySentence;
    const displayArea = document.getElementById('spelling-word-display');
    displayArea.innerHTML = "";
    for (let i = 0; i < targetWord.length; i++) {
        const span = document.createElement('span');
        span.className = "letter-slot";
        span.innerText = "_";
        displayArea.appendChild(span);
    }
    renderLetterButtons(targetWord, item.correction); // 琴晚版用 correction 欄位放額外字母
}

function renderLetterButtons(answer, extraOptions) {
    const container = document.getElementById('spelling-options');
    container.innerHTML = "";
    let letters = answer.split('');
    if (extraOptions) letters = letters.concat(extraOptions.split(''));
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
        alert(`Score: ${spellingState.correctCount} / ${spellingState.questions.length}`);
        showScreen('menu-screen');
    }
}

function startRearrangeGame() {
    const questions = gameData.Rearrange;
    if (!questions || questions.length === 0) return alert("No data!");
    updateCategoryDropdown('Rearrange');
    rearrangeState.questions = [...questions];
    rearrangeState.currentQuestionIndex = 0;
    rearrangeState.correctCount = 0;
    showScreen('rearrange-screen');
    loadRearrangeQuestion();
}

function loadRearrangeQuestion() {
    document.getElementById('rearrange-feedback').style.display = 'none';
    document.getElementById('rearrange-options').style.display = 'flex';
    document.getElementById('rearrange-undo-container').style.display = 'block';
    document.getElementById('rearrange-options').style.pointerEvents = 'auto';
    rearrangeState.userAnswerArray = [];
    const item = rearrangeState.questions[rearrangeState.currentQuestionIndex];
    currentCorrectSentence = item.context.trim();
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
    renderRearrangeDisplay();
}

function handleWordClick(word, btn) {
    rearrangeState.userAnswerArray.push(word);
    renderRearrangeDisplay();
    btn.disabled = true;
    btn.style.opacity = "0.3";
    if (rearrangeState.userAnswerArray.length === currentCorrectSentence.split(' ').length) {
        checkRearrangeResult();
    }
}

function checkRearrangeResult() {
    const playerSentence = rearrangeState.userAnswerArray.join(' ');
    const feedbackArea = document.getElementById('rearrange-feedback');
    const feedbackText = document.getElementById('rearrange-feedback-text');
    document.getElementById('rearrange-undo-container').style.display = 'none';
    document.getElementById('rearrange-options').style.display = 'none';
    if (playerSentence === currentCorrectSentence) {
        feedbackText.innerText = "✅ Excellent!";
        feedbackText.style.color = "#28a745";
        rearrangeState.correctCount++;
    } else {
        feedbackText.innerText = "❌ " + currentCorrectSentence;
        feedbackText.style.color = "#dc3545";
    }
    feedbackArea.style.display = 'block';
}

function nextRearrangeQuestion() {
    rearrangeState.currentQuestionIndex++;
    if (rearrangeState.currentQuestionIndex < rearrangeState.questions.length) {
        loadRearrangeQuestion();
    } else {
        alert(`Score: ${rearrangeState.correctCount} / ${rearrangeState.questions.length}`);
        showScreen('menu-screen');
    }
}

function undoLastWord() {
    if (rearrangeState.userAnswerArray.length === 0) return;
    const removedWord = rearrangeState.userAnswerArray.pop();
    renderRearrangeDisplay();
    const btns = document.querySelectorAll('#rearrange-options .letter-btn');
    for (let btn of btns) {
        if (btn.innerText === removedWord && btn.disabled) {
            btn.disabled = false; btn.style.opacity = "1"; break;
        }
    }
}

function renderRearrangeDisplay() {
    const area = document.getElementById('rearrange-word-display');
    area.innerHTML = ""; 
    rearrangeState.userAnswerArray.forEach(word => {
        const span = document.createElement('span');
        span.innerText = word; span.className = "selected-word"; area.appendChild(span);
    });
}

function speakSentence() {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(currentCorrectSentence);
    u.lang = 'en-US'; u.rate = 0.85; window.speechSynthesis.speak(u);
}

function startProofreadGame() {
    const qs = gameData.Proofread;
    if (!qs || qs.length === 0) return;
    updateCategoryDropdown('Proofread');
    proofreadState.questions = [...qs];
    proofreadState.currentQuestionIndex = 0;
    proofreadState.correctCount = 0;
    showScreen('proofread-screen');
    loadProofreadQuestion();
}

function loadProofreadQuestion() {
    const item = proofreadState.questions[proofreadState.currentQuestionIndex];
    const displayArea = document.getElementById('proofread-sentence-display');
    document.getElementById('correction-input-area').style.display = 'none';
    document.getElementById('proofread-feedback').style.display = 'none';
    displayArea.innerHTML = "";
    document.getElementById('user-correction').value = "";
    item.context.split(' ').forEach(word => {
        const span = document.createElement('span');
        span.innerText = word + " ";
        span.style.cursor = "pointer";
        span.onclick = () => {
            document.getElementById('correction-input-area').style.display = 'block';
            document.getElementById('selected-wrong-word').innerText = word.replace(/[.,!?;:]/g, "");
            proofreadState.targetWord = word.replace(/[.,!?;:]/g, "").toLowerCase();
        };
        displayArea.appendChild(span);
    });
}

function checkCorrection() {
    const item = proofreadState.questions[proofreadState.currentQuestionIndex];
    const userInp = document.getElementById('user-correction').value.trim().toLowerCase();
    const feedback = document.getElementById('proofread-feedback-text');
    if (proofreadState.targetWord === item.answer.toLowerCase() && userInp === item.correction.toLowerCase()) {
        feedback.innerText = "✅ Fixed!"; feedback.style.color = "green"; proofreadState.correctCount++;
    } else {
        feedback.innerText = `❌ Error was "${item.answer}" -> "${item.correction}"`; feedback.style.color = "red";
    }
    document.getElementById('proofread-feedback').style.display = 'block';
}

function nextProofreadQuestion() {
    proofreadState.currentQuestionIndex++;
    if (proofreadState.currentQuestionIndex < proofreadState.questions.length) loadProofreadQuestion();
    else { alert("Done!"); showScreen('menu-screen'); }
}

function updateCategoryDropdown(mode) {
    const dropdown = document.getElementById(`${mode.toLowerCase()}-category-filter`);
    if (!dropdown) return;
    const cats = [...new Set(gameData[mode].map(item => item.category))];
    dropdown.innerHTML = '<option value="all">全部類別</option>';
    cats.forEach(cat => { if (cat) { const opt = document.createElement('option'); opt.value = cat; opt.innerText = cat; dropdown.appendChild(opt); } });
}

function filterByCategory(mode) {
    const dropdown = document.getElementById(`${mode.toLowerCase()}-category-filter`);
    const selectedCat = dropdown.value;
    let filtered = gameData[mode].filter(q => selectedCat === 'all' || q.category === selectedCat);
    if (mode === 'Rearrange') { rearrangeState.questions = filtered; rearrangeState.currentQuestionIndex = 0; loadRearrangeQuestion(); }
    else if (mode === 'Spelling') { spellingState.questions = filtered; spellingState.currentQuestionIndex = 0; loadSpellingQuestion(); }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}
