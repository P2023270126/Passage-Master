/**
 * 程式文件：核心路由與資料載入
 * 功能：處理身份切換與對應的 Google Sheets 連結
 */

let currentUser = "";
let gameData = [];

// 請在此處填入你發佈的 CSV 連結
const CSV_CONFIG = {
    "66": "https://docs.google.com/spreadsheets/d/e/YOUR_JASPER_CSV_ID/pub?output=csv",
    "22": "https://docs.google.com/spreadsheets/d/e/YOUR_JOLIE_CSV_ID/pub?output=csv"
};

/**
 * 選擇用戶並開始載入資料
 * @param {string} userId - '66' 或 '22'
 */
function selectUser(userId) {
    currentUser = userId;
    const csvUrl = CSV_CONFIG[userId];
    
    document.getElementById('welcome-msg').innerText = `你好, ${userId === '66' ? 'Jasper' : 'Jolie'}`;
    
    // 執行載入資料 (此處接續你之前的 PapaParse 或 fetch 邏輯)
    fetchData(csvUrl);
}

function fetchData(url) {
    console.log("正在從此處獲取資料: " + url);
    // 這裡將會放置我們處理 CSV 的程式碼
    showScreen('menu-screen');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

function logout() {
    location.reload(); // 簡單重置遊戲
}
