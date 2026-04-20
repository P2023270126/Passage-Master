/**
 * 程式文件：核心邏輯與資料載入
 * 功能：處理身份選擇、CSV 讀取與模式分類
 */

// 1. 設定與變數
let currentUser = "";
let gameData = {
    Spelling: [],
    Rearrange: [],
    Proofread: [],
    Cloze: []
};

// 請將 YOUR_JASPER_CSV_URL 與 YOUR_JOLIE_CSV_URL 替換為你在 Google Sheets 發佈的 CSV 連結
const CSV_CONFIG = {
    "66": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTh9dDHpQwH8uY0QJjkjlQKTnLyQokNhIgjNUD8B3zM83_2BuHI2z0_Zg57gX1i9fJO25pSK4pOcZyW/pub?output=csv",
    "22": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1SzwdMgvtmqJrVqawDMrf33UvA6b7C9PbCkjNaKqGLIOu-6tSGuD-EJJ1tBaTyCYMrLcJD_GSezQo/pub?output=csv"
};

/**
 * 步驟 A: 選擇用戶並初始化
 */
async function selectUser(userId) {
    currentUser = userId;
    const url = CSV_CONFIG[userId];
    
    if (!url || url.includes("YOUR_")) {
        alert("請先在 app.js 中設定正確的 CSV 連結！");
        return;
    }

    document.getElementById('welcome-msg').innerText = `Loading data for ${userId === '66' ? 'Jasper' : 'Jolie'}...`;
    
    // 載入 PapaParse 並抓取資料
    await loadData(url);
}

/**
 * 步驟 B: 抓取並解析 CSV
 */
async function loadData(url) {
    // 動態載入 PapaParse 庫 (如果 index.html 沒寫的話)
    if (typeof Papa === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js";
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }

    Papa.parse(url, {
        download: true,
        header: true,
        complete: function(results) {
            processData(results.data);
            showScreen('menu-screen');
            document.getElementById('welcome-msg').innerText = `Welcome, ${currentUser === '66' ? 'Jasper' : 'Jolie'}`;
        },
        error: function(err) {
            console.error("資料讀取失敗:", err);
            alert("讀取資料失敗，請檢查 CSV 連結是否正確且已發佈。");
        }
    });
}

/**
 * 步驟 C: 將資料分類
 */
function processData(rawData) {
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
    console.log("資料處理完畢:", gameData);
}

/**
 * 輔助功能：切換螢幕
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}
