// ==UserScript==
// @name         格式化 PAMS 光纜心線
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  格式化光纜心線收容列印為公館機房樣式，並防止表格自動伸縮
//               ※1.0 版全雙芯表格可用 (以 TCKK-TCK2-FIB-3 為例)，單芯、雙芯混雜表格待完善。
// @author       noi
// @match        https://web.pams.cht.com.tw/sys/OPTDAT/form_OLDFtag_3*
// @icon         https://web-eshop.cdn.hinet.net/eshop/img/favicon.ico
// @updateURL    https://github.com/henman0123/UserScripts/raw/refs/heads/main/Format_PAMS_OPTDAT.user.js
// @downloadURL  https://github.com/henman0123/UserScripts/raw/refs/heads/main/Format_PAMS_OPTDAT.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 初步格式化原單芯表格
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
           // 方法很不優雅但有用
           if (td.getAttribute('height') === '20%') {
               td.style.minWidth = '65px';
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

    //移除所有單芯表格重複內容
    function removeDuplicateContent() {
        var fonts = document.querySelectorAll('font.sys');
        for (let i = 0; i < fonts.length - 1; i++) {
            let currentFont = fonts[i];
            let nextFont = fonts[i + 1];
            if (currentFont.innerHTML === nextFont.innerHTML) {
                nextFont.innerHTML = '';
            }
        }
    }

    //重構為雙芯表格
    function restructureTable() {
        removeDuplicateContent();

        let oldTable = document.querySelector('table.tableR');
        if (!oldTable) return;

        let newTable = document.createElement('table');
        newTable.className = 'tableR';
        newTable.border = '1';
        newTable.cellSpacing = '0';
        newTable.cellPadding = '0';
        newTable.style.cssText = 'border-right: windowtext 1pt solid; border-top: windowtext 1pt solid; border-left: windowtext 1pt solid; border-bottom: windowtext 1pt solid; background-color: transparent;';

        // 創建標題行
        let headerRow = newTable.insertRow();
        let headerCell = headerRow.insertCell();
        headerCell.colSpan = '24';
        headerCell.align = 'middle';
        headerCell.style.height = '5%';
        headerCell.innerHTML = oldTable.rows[0].cells[0].innerHTML;

        // 收集原始內容
        let contents = [];
        for (let row = 1; row <= 4; row++) {
            if (oldTable.rows[row]) {
                let rowContents = [];
                for (let i = 0; i < oldTable.rows[row].cells.length; i++) {
                    let cell = oldTable.rows[row].cells[i];
                    rowContents.push(cell.querySelector('.sys') ? cell.querySelector('.sys').innerHTML : '空線');
                }
                contents.push(rowContents);
            }
        }

        // 創建四組編號行和內容行
        for (let group = 0; group < 4; group++) {
            // 創建編號行
            let numberRow = newTable.insertRow();
            for (let i = 1; i <= 24; i++) {
                let cell = numberRow.insertCell();
                cell.align = 'center';
                cell.style.cssText = 'width: 4%; height: 6px; border-top: windowtext 1.5pt solid; border-bottom: windowtext 0.5pt solid; background-color: transparent;';
                cell.innerHTML = `<font size="1"><b>${group * 24 + i}</b></font>`;
            }

            // 創建內容行
            let contentRow = newTable.insertRow();
            for (let i = 0; i < 12; i++) {
                let cell = contentRow.insertCell();
                cell.colSpan = '2';
                cell.style.cssText = 'width: 8%; height: 23%;';

                let innerTable = document.createElement('table');
                innerTable.style.cssText = 'width: 100%; height: 100%;';
                innerTable.cellSpacing = '0';
                innerTable.cellPadding = '0';

                let innerRow = innerTable.insertRow();
                let innerCell = innerRow.insertCell();
                innerCell.align = 'middle';
                innerCell.style.cssText = 'height: 20%; border-bottom: windowtext 0.5pt solid;';

                // 映射邏輯
                let contentIndex = i * 2;
                if (contents[group] && contentIndex < contents[group].length) {
                    innerCell.innerHTML = `<font class="sys">${contents[group][contentIndex]}</font>`;
                } else {
                    innerCell.innerHTML = `<font class="sys">空線</font>`;
                }

                cell.appendChild(innerTable);
            }
        }

        oldTable.parentNode.replaceChild(newTable, oldTable);
    }

    // 當網頁載入完成後，執行 processTable 和 restructureTable 函數
    window.addEventListener('load', processTable);
    window.addEventListener('load', restructureTable);

    // 每隔 1 秒重複執行 processTable 函數，確保即使動態載入也能處理表格
    //setInterval(processTable, 1000);
})();
