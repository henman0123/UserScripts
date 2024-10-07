
// ==UserScript==
// @name         格式化 PAMS 光纜心線
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  格式化光纜心線收容列印為公館機房樣式，支援橫列 96 芯、108 芯、 216 芯。
// @author       noi
// @match        https://web.pams.cht.com.tw/sys/OPTDAT/form_OLDFtag_3*
// @icon         https://web-eshop.cdn.hinet.net/eshop/img/favicon.ico
// @updateURL    https://github.com/henman0123/UserScripts/raw/refs/heads/main/Format_PAMS_OPTDAT.user.js
// @downloadURL  https://github.com/henman0123/UserScripts/raw/refs/heads/main/Format_PAMS_OPTDAT.user.js
// ==/UserScript==

(function() {
    'use strict';

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

    function analyzeTableStructure(oldTable) {
        let structure = [];
        let rowCount = oldTable.rows.length - 2; // 排除標題行
        for (let row = 1; row <= rowCount; row++) {
            if (oldTable.rows[row]) {
                let rowStructure = [];
                for (let i = 0; i < oldTable.rows[row].cells.length; i++) {
                    let cell = oldTable.rows[row].cells[i];
                    let content = cell.querySelector('.sys') ? cell.querySelector('.sys').innerHTML : '';
                    let nextContent = (i + 1 < oldTable.rows[row].cells.length && oldTable.rows[row].cells[i + 1].querySelector('.sys')) ? oldTable.rows[row].cells[i + 1].querySelector('.sys').innerHTML : '';

                    if (content === '空線' || content === '') {
                        rowStructure.push({ content: '', type: 'empty' });
                    } else if (content && !nextContent) {
                        rowStructure.push({ content, type: 'double' });
                        i++; // Skip the next cell as it's part of the double core
                    } else if (content) {
                        rowStructure.push({ content, type: 'single' });
                    }
                }
                structure.push(rowStructure);
            }
        }
        return structure;
    }

    function determineTableType(structure) {
        let isAllDouble = structure.every(row => row.every(cell => cell.type === 'double' || cell.type === 'empty'));
        let isAllSingle = structure.every(row => row.every(cell => cell.type === 'single' || cell.type === 'empty'));

        if (isAllDouble) return 'allDouble';
        if (isAllSingle) return 'allSingle';
        return 'mixed';
    }

    function mapAllDouble(structure, newTable, startIndex = 0) {
        for (let group = 0; group < structure.length; group++) {
            // 創建編號行
            let numberRow = newTable.insertRow();
            for (let i = 0; i < 24; i++) {
                let cell = numberRow.insertCell();
                cell.align = 'center';
                cell.style.cssText = 'width: 4%; height: 6px; border-top: windowtext 1.5pt solid; border-bottom: windowtext 0.5pt solid; background-color: transparent;';
                cell.innerHTML = `<font size="1"><b>${startIndex + group * 24 + i}</b></font>`;
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

                let content = structure[group][i * 2] ? structure[group][i * 2].content : '空線';
                innerCell.innerHTML = `<font class="sys">${content}</font>`;

                cell.appendChild(innerTable);
            }
        }
    }

    function mapMixedOrSingle(structure, newTable, startIndex = 0) {
        for (let group = 0; group < structure.length; group++) {
            // 創建編號行
            let numberRow = newTable.insertRow();
            for (let i = 0; i < 24; i++) {
                let cell = numberRow.insertCell();
                cell.align = 'center';
                cell.style.cssText = 'width: 4%; height: 6px; border-top: windowtext 1.5pt solid; border-bottom: windowtext 0.5pt solid; background-color: transparent;';
                cell.innerHTML = `<font size="1"><b>${startIndex + group * 24 + i}</b></font>`;
            }

            // 創建內容行
            let contentRow = newTable.insertRow();
            let cellIndex = 0;
            for (let i = 0; i < structure[group].length && cellIndex < 24; i++) {
                let { content, type } = structure[group][i];
                let cell = contentRow.insertCell();

                if (type === 'double') {
                    cell.colSpan = '2';
                    cell.style.cssText = 'width: 8%; height: 23%;';
                    cellIndex += 2;
                } else {
                    cell.style.cssText = 'width: 4%; height: 23%;';
                    cellIndex++;
                }

                let innerTable = document.createElement('table');
                innerTable.style.cssText = 'width: 100%; height: 100%;';
                innerTable.cellSpacing = '0';
                innerTable.cellPadding = '0';

                let innerRow = innerTable.insertRow();
                let innerCell = innerRow.insertCell();
                innerCell.align = 'middle';
                innerCell.style.cssText = 'height: 20%; border-bottom: windowtext 0.5pt solid;';
                innerCell.innerHTML = `<font class="sys">${content}</font>`;

                cell.appendChild(innerTable);
            }

            // 填充剩餘的空白單元格
            while (cellIndex < 24) {
                let cell = contentRow.insertCell();
                cell.style.cssText = 'width: 4%; height: 23%;';
                cell.innerHTML = '<font class="sys">空線(程式填充)</font>';
                cellIndex++;
            }
        }
    }

    function restructureTable(oldTable, startIndex = 0) {
        let newTable = document.createElement('table');
        newTable.className = 'tableR';
        newTable.border = '1';
        newTable.cellSpacing = '0';
        newTable.cellPadding = '0';
        newTable.style.cssText = 'border-right: windowtext 1pt solid; border-top: windowtext 1pt solid; border-left: windowtext 1pt solid; border-bottom: windowtext 1pt solid; background-color: transparent; table-layout: auto; width: 90%; margin-bottom: 20px;';

        // 創建標題行
        let headerRow = newTable.insertRow();
        let headerCell = headerRow.insertCell();
        headerCell.colSpan = '24';
        headerCell.align = 'middle';
        headerCell.style.height = '5%';
        headerCell.innerHTML = oldTable.rows[0].cells[0].innerHTML;

        let structure = analyzeTableStructure(oldTable);
        let tableType = determineTableType(structure);

        if (tableType === 'allDouble') {
            mapAllDouble(structure, newTable, startIndex);
        } else {
            mapMixedOrSingle(structure, newTable, startIndex);
        }

        return newTable;
    }

    function processAllTables() {
        removeDuplicateContent();

        let oldTables = document.querySelectorAll('table.tableR');
        if (oldTables.length === 0) return;

        let container = oldTables[0].parentNode;
        oldTables.forEach((oldTable, index) => {
            let startIndex = index * 108 + 1; // 每個表格從1或109開始編號
            let newTable = restructureTable(oldTable, startIndex);
            container.insertBefore(newTable, oldTable);
            oldTable.remove();
        });

        processTable();
    }

    function processTable() {
        // 移除包含 <font class="sysc"> 的 <tr> 元素
        let allTRs = document.getElementsByTagName('tr');
        let trArray = Array.from(allTRs);
        let trsToRemove = trArray.filter(tr => {
            let tdContent = tr.innerHTML;
            return tdContent.includes('<font class="sysc">') && !tdContent.includes('<font class="sys">');
        });
        trsToRemove.forEach(tr => tr.remove());

        // 處理剩餘的 <td> 元素
        let remainingTDs = document.getElementsByTagName('td');

        Array.from(remainingTDs).forEach(td => {
            if (td.getAttribute('height') === '20%') {
                td.style.maxWidth = '50px';
                td.style.height = '100px';
            }

            if (td.textContent.includes('空線')) {
                td.innerHTML = td.innerHTML.replace(/空線/g, '');
            }

            if (td.textContent.includes('專線')) {
                td.innerHTML = td.innerHTML.replace(/專線/g, '');
            }

            if (td.textContent.includes('FTTB')) {
                td.innerHTML = td.innerHTML.replace(/FTTB/g, '');
            }

            td.setAttribute('align', 'middle');
        });

        // 為所有 <font class="sys"> 標籤設置字體大小
        let sysFonts = document.querySelectorAll('font.sys');
        sysFonts.forEach(font => {
            font.style.fontSize = '12px';
        });

        // 移除包含 "謝謝合作" 且寬度 > 1000px 的 tr 標籤
        allTRs = document.getElementsByTagName('tr');
        trArray = Array.from(allTRs);

        trArray.forEach(tr => {
            if (tr.textContent.includes('謝謝合作') && tr.offsetWidth > 1000) {
                tr.parentNode.removeChild(tr);
            }
        });
    }

    // 當網頁載入完成後，執行 processAllTables 函數
    window.addEventListener('load', processAllTables);
})();
