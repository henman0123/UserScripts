// ==UserScript==
// @name         格式化 PAMS 光纜心線
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  格式化光纜心線收容列印為公館機房樣式，並防止表格自動伸縮
// @match        https://web.pams.cht.com.tw/sys/OPTDAT/form_OLDFtag_3*
// @icon         https://web-eshop.cdn.hinet.net/eshop/img/favicon.ico
// @updateURL    https://github.com/henman0123/UserScripts/raw/refs/heads/main/Format_PAMS_OPTDAT.user.js
// @downloadURL  https://github.com/henman0123/UserScripts/raw/refs/heads/main/Format_PAMS_OPTDAT.user.js
// ==/UserScript==

(function() {
    'use strict';


    // 主要處理函數
    function processTable() {
        // 第一步: 移除包含 <font class="sysc"> 的 <tr> 元素
        let allTRs = document.getElementsByTagName('tr');
        let trArray = Array.from(allTRs);
        let trsToRemove = trArray.filter(tr => {
            let tdContent = tr.innerHTML;
            return tdContent.includes('<font class="sysc">') && !tdContent.includes('<font class="sys">');
        });
        trsToRemove.forEach(tr => tr.remove());

        // 第二步: 處理剩餘的 <td> 元素
        let remainingTDs = document.getElementsByTagName('td');

        Array.from(remainingTDs).forEach(td => {
           // 重寫所有 height = "20%" <td> 的 min-width 和 height
           // 寫法很髒但有用
           if (td.getAttribute('height') === '20%') {
               td.style.minWidth = '50px';
               td.style.height = '100px';
           }

            // 統一使用 innerHTML，避免 DOM 樹異常。
            // 如果 <td> 內容包含 "空線"，則將其替換為空白
            if (td.textContent.includes('空線')) {
                td.innerHTML = td.innerHTML.replace(/空線/g, '');
            }

            // 如果 <td> 內容包含 "專線"，則將其替換為空白
            if (td.textContent.includes('專線')) {
                td.innerHTML = td.innerHTML.replace(/專線/g, '');
            }

            // 如果 <td> 內容包含 "FTTB"，則將其替換為空白
            if (td.textContent.includes('FTTB')) {
                td.innerHTML = td.innerHTML.replace(/FTTB/g, '');
            }

            // 為每個 <td> 元素添加 align="middle" 屬性，讓內容垂直居中
            td.setAttribute('align', 'middle');
        });

        // 第三步：為所有 <font class="sys"> 標籤設置字體大小
        let sysFonts = document.querySelectorAll('font.sys');
        sysFonts.forEach(font => {
            font.style.fontSize = '16px';
        });

        // 第四步：移除包含 "謝謝合作" 且寬度 > 1000px 的 tr 標籤
        allTRs = document.getElementsByTagName('tr');
        trArray = Array.from(allTRs);

        trArray.forEach(tr => {
            if (tr.textContent.includes('謝謝合作') && tr.offsetWidth > 1000) {
                tr.parentNode.removeChild(tr);
            }
        });
    }

    // 當網頁載入完成後，執行 processTable 函數
    window.addEventListener('load', processTable);
    // 每隔 1 秒重複執行 processTable 函數，確保即使動態載入也能處理表格
    setInterval(processTable, 1000);
})();
