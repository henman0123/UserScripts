// ==UserScript==
// @name         格式化 PAMS TIE
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  格式化光纜 TIE 跳接箱芯線收容列印為公館機房樣式 (機房 TIE 管理系統 => 右上角標籤列印 => OLDF標籤) ※0.3版僅匹配橫向每24格一列。
// @match        https://web.pams.cht.com.tw/sys/innerTie/form_OLDFtag_3*
// @icon         https://web-eshop.cdn.hinet.net/eshop/img/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 主要處理函數
    function processTable() {
        // 第一步
        // 移除包含 <font class="sysc"> 的 tr 元素
        let allTRs = document.getElementsByTagName('tr');
        // 將 HTMLCollection 轉換為陣列
        let trArray = Array.from(allTRs);
        // 過濾出包含 <font class="sysc"> 的 tr 元素，但不包括其子元素含有 <font class="sys"> 的 tr 元素
        let trsToRemove = trArray.filter(tr => {
            let tdContent = tr.innerHTML;
            return tdContent.includes('<font class="sysc">') && !tdContent.includes('<font class="sys">');
        });
        // 移除這些 tr 元素
        trsToRemove.forEach(tr => tr.remove());

        // 第二步
        // 處理剩餘的 td 元素
        let remainingTDs = document.getElementsByTagName('td');

        Array.from(remainingTDs).forEach(td => {
            // 替換"空線"為空白
            if (td.textContent.includes('空線')) {
                td.textContent = td.textContent.replace(/空線/g, '');
            }

            // 替換"專線"為空白
            if (td.textContent.includes('專線')) {
                td.textContent = td.textContent.replace(/專線/g, '');
            }

            // 為所有 td 元素添加 align="middle" 屬性
            td.setAttribute('align', 'middle');

            // 獲取當前 td 元素的高度
            let currentHeight = td.offsetHeight;

            // 如果目前 td 元素高度超過 50px，將其設置為 124px
            if (currentHeight > 50) {
                td.style.height = '124px';
            }
            // 最後處理最下方的 td 元素高度
             if (td.textContent.includes('謝謝合作')) {
                td.style.height = '12px';
            }
        });
    }

    // 在頁面加載完成後執行處理函數
    window.addEventListener('load', processTable);
    setInterval(processTable, 1000);
})();