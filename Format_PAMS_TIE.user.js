// ==UserScript==
// @name         格式化 PAMS TIE
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  格式化光纜 TIE 跳接箱芯線收容列印為公館機房樣式
//               (機房 TIE 管理系統 => 右上角標籤列印 => OLDF標籤)
//               ※目前版本僅匹配橫向 n 格一列。
// @match        https://web.pams.cht.com.tw/sys/innerTie/form_OLDFtag_3*
// @icon         https://web-eshop.cdn.hinet.net/eshop/img/favicon.ico
// @updateURL    https://github.com/henman0123/UserScripts/raw/refs/heads/main/Format_PAMS_TIE.user.js
// @downloadURL  https://github.com/henman0123/UserScripts/raw/refs/heads/main/Format_PAMS_TIE.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 主要處理函數
    function processTable() {
        // 第一步: 移除包含 <font class="sysc"> 的 <tr> 元素
        // 獲取頁面中所有的 <tr> 標籤
        let allTRs = document.getElementsByTagName('tr');
        // 將 HTMLCollection 轉換為 JavaScript 陣列，方便使用 Array 的方法
        let trArray = Array.from(allTRs);
        // 過濾出包含 <font class="sysc"> 的 <tr>，且不包含 <font class="sys"> 的 <tr>
        let trsToRemove = trArray.filter(tr => {
            // 取得 <tr> 標籤的內部 HTML
            let tdContent = tr.innerHTML;
            // 判斷該行是否包含 <font class="sysc">，同時不包含 <font class="sys">
            return tdContent.includes('<font class="sysc">') && !tdContent.includes('<font class="sys">');
        });
        // 移除符合條件的 <tr> 元素
        trsToRemove.forEach(tr => tr.remove());

        // 第二步: 處理剩餘的 <td> 元素
        // 獲取所有 <td> 標籤
        let remainingTDs = document.getElementsByTagName('td');

        // 遍歷每個 <td> 元素
        Array.from(remainingTDs).forEach(td => {
            // 如果 <td> 內容包含 "空線"，則將其替換為空白
            if (td.textContent.includes('空線')) {
                td.textContent = td.textContent.replace(/空線/g, '');
            }

            // 如果 <td> 內容包含 "專線"，則將其替換為空白
            if (td.textContent.includes('專線')) {
                td.textContent = td.textContent.replace(/專線/g, '');
            }

            // 如果 <td> 內容包含 "FTTB"，則將其替換為空白
            if (td.textContent.includes('FTTB')) {
                td.textContent = td.textContent.replace(/FTTB/g, '');
            }

            // 為每個 <td> 元素添加 align="middle" 屬性，讓內容垂直居中並設定字體大小為 16px
            td.setAttribute('align', 'middle');
            td.style.fontSize = '16px';

            // 獲取當前 <td> 的高度
            let currentHeight = td.offsetHeight;

            // 如果 <td> 的高度超過 50px，則將其高度設置為 124px
            if (currentHeight > 50) {
                td.style.height = '124px';
            }

            //保留用
            /* 特殊處理: 如果 <td> 內容包含 "謝謝合作"，將該 <td> 的高度設置為 12px
            if (td.textContent.includes('謝謝合作')) {
                td.style.height = '12px';
            }
            */

            // 特殊處理：為所有 <font class="sys"> 標籤設置字體大小
            let sysFonts = document.querySelectorAll('font.sys');
            sysFonts.forEach(font => {
                font.style.fontSize = '16px';
            });

            // 特殊處理：移除包含 "謝謝合作" 且寬度 > 1000px 的 tr 標籤
            allTRs = document.getElementsByTagName('tr'); // 重新獲取 <tr>
            trArray = Array.from(allTRs);

            trArray.forEach(tr => {
                if (tr.textContent.includes('謝謝合作') && tr.offsetWidth > 1000) {
                    tr.parentNode.removeChild(tr);
                }


            });
        });
    }

    // 當網頁載入完成後，執行 processTable 函數
    window.addEventListener('load', processTable);
    // 每隔 1 秒重複執行 processTable 函數，確保即使動態載入也能處理表格
    setInterval(processTable, 1000);
})();
