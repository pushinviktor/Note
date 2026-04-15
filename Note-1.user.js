// ==UserScript==
// @name         Note
// @namespace    http://tampermonkey.net/
// @version      1
// @match        *://app.chatwoot.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    let badge = null;
    let hoverTimeout = null;
    let hideTimeout = null;

    GM_addStyle(`
        .sup-badge {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1e293b;
            color: white;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            z-index: 9999;
            box-shadow: 0 6px 16px rgba(0,0,0,0.25);
            font-family: Arial;

            transition: all 0.2s ease;
            opacity: 1;
            transform: translateY(0);
        }

        .sup-found { background: #16a34a; }
        .sup-notfound { background: #dc2626; }
    `);

    function extractSUP(text) {
        return text.match(/SUP-\d+/)?.[0] || null;
    }

    function extractTXN(text) {
        return text.match(/\b\d{10,}\b/)?.[0] || null;
    }

    function getMessageText(el) {
        const bubble = el.querySelector('.prose.prose-bubble');
        return bubble ? bubble.innerText.trim() : '';
    }

    function getNotesText() {
        const notes = document.querySelectorAll('.conversation--details p');

        let fullText = '';
        notes.forEach(n => {
            const text = n.innerText.trim();
            if (text && text !== '---') {
                fullText += text + ' ';
            }
        });

        return fullText;
    }

    function showBadge(text, found) {
        if (badge) badge.remove();
        clearTimeout(hideTimeout);

        badge = document.createElement('div');
        badge.className = `sup-badge ${found ? 'sup-found' : 'sup-notfound'}`;
        badge.innerText = found ? `✅ Есть в заметках: ${text}` : `❌ Нет в заметках: ${text}`;

        document.body.appendChild(badge);

        // авто-зникнення
        hideTimeout = setTimeout(() => {
            if (badge) {
                badge.style.opacity = '0';
                badge.style.transform = 'translateY(-10px)';

                setTimeout(() => {
                    if (badge) {
                        badge.remove();
                        badge = null;
                    }
                }, 200);
            }
        }, 2500);
    }

    document.body.addEventListener('mouseover', e => {
        const message = e.target.closest('[data-bubble-name="text"]');
        if (!message) return;

        clearTimeout(hoverTimeout);

        hoverTimeout = setTimeout(() => {
            const text = getMessageText(message);

            const sup = extractSUP(text);
            const txn = extractTXN(text);

            if (!sup && !txn) return;

            const searchValue = sup || txn;

            const notesText = getNotesText();
            const found = notesText.includes(searchValue);

            showBadge(searchValue, found);

        }, badge ? 0 : 250);
    });

    document.body.addEventListener('mouseout', () => {
        clearTimeout(hoverTimeout);
    });

})();