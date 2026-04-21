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
                gameData[mode].push({
                    category: row.Category,
                    context: row.Context,        // Column C: 題目句子
                    marker: row.Answer,         // Column D: 要點擊嘅提示詞
                    fullSentence: row.Correction, // Column E: 填空句子
                    verbOptions: row.Marker,     // Column F: go|went|goes
                    finalAnswer: row.Correct_Verb // Column G: 正確答案
                });
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
    
    // 顯示兩行：第一行係題目(搵 Marker)，第二行係填空句
    container.innerHTML = `
        <div style="font-size: 1rem; color: #666; margin-bottom: 10px;">Find the marker in this sentence:</div>
        <div id="tm-question-line" style="margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;"></div>
        <div id="tm-fill-blank-line" style="font-weight: bold; color: #2c3e50;">${q.fullSentence}</div>
    `;

    const questionLine = document.getElementById('tm-question-line');
    const targetMarker = (q.marker || "").trim().toLowerCase();

    // 處理 Column C 嘅題目，等 Jasper 點擊 Marker
    q.context.split(' ').forEach(word => {
        const cleanWord = word.replace(/[.,!?;:]/g, "").trim().toLowerCase();
        const span = document.createElement('span');
        span.innerText = word + " ";
        span.className = "tm-marker";
        span.onclick = () => {
            if (tmState.selectedMarker) return;
            if (cleanWord === targetMarker) {
                span.classList.add('selected');
                tmState.selectedMarker = true;
                feedback.innerText = "🎯 Found it! Now choose the verb.";
                feedback.style.color = "blue";
                showTmOptions(q);
            } else {
                feedback.innerText = "❌ Not this one!";
                feedback.style.color = "red";
            }
        };
        questionLine.appendChild(span);
    });
}

function showTmOptions(q) {
    const optionsCont = document.getElementById('tm-options');
    optionsCont.innerHTML = "";
    document.getElementById('tm-step2-area').style.display = "block";

    // 根據 Column F 嘅 "|" 嚟拆開按鈕
    const opts = q.verbOptions.split('|').map(s => s.trim());
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "letter-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            if (opt === q.finalAnswer) { // 對比 Column G
                document.getElementById('tm-feedback').innerText = "✅ Correct! Well done!";
                document.getElementById('tm-feedback').style.color = "green";
                tmState.correctCount++;
                document.getElementById('tm-next-btn').style.display = "block";
            } else {
                document.getElementById('tm-feedback').innerText = "❌ Wrong! Try again.";
                document.getElementById('tm-feedback').style.color = "red";
            }
        };
        optionsCont.appendChild(btn);
    });
}

function showTmOptions(q) {
    const optionsCont = document.getElementById('tm-options');
    optionsCont.innerHTML = "";
    document.getElementById('tm-step2-area').style.display = "block";
    document.getElementById('tm-instruction').innerText = "Step 2: Choose the Correct Verb";

    const opts = q.answer.split(',').map(s => s.trim()); // CSV Answer 擺放選項，Correction 擺正確答案
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "letter-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            const feedback = document.getElementById('tm-feedback');
            if (opt === q.correction) {
                feedback.innerText = "✅ Perfect! Correct Tense!";
                feedback.style.color = "green";
                tmState.correctCount++;
            } else {
                feedback.innerText = `❌ Wrong. The answer is "${q.correction}"`;
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
