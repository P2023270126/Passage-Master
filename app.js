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
