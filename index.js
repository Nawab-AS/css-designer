const { createApp, ref, watch } = Vue;

const pageHTML = ref('');
const modal = ref('');
const selectMode = ref(false);
const selectedElementInfo = ref(null);
const cssProps = ref(JSON.parse(JSON.stringify(cssConfig)));

function loadHTMLToIframe(html) {
    const iframe = document.getElementById('iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const cleanHTML = html.replace(/<script.*?<\/script>/gis, ''); // remove script tags to prevent XSS
    modal.value = html != cleanHTML ? 'XSSWarning' : '';
    doc.open();
    doc.write(cleanHTML);
    doc.close();

    setTimeout(() => {
        if (selectMode.value) injectSelectionScript();
    }, 100);
}

function getHTMLFromIframe() {
    const iframe = document.getElementById('iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    return doc.documentElement.outerHTML;
}

function startSelectMode() {
    selectMode.value = true;
    injectSelectionScript();
}

const scriptId = Math.random().toString(36).slice(2);
function injectSelectionScript() {
    const iframe = document.getElementById('iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;
    removeSelectionScript();
    const script = doc.createElement('script');
    script.id = scriptId;
    script.textContent = `
        (function() {
            let last;
            let infoBox;
            function createInfoBox() {
                infoBox = document.createElement('div');
                infoBox.style.position = 'fixed';
                infoBox.style.zIndex = '99999';
                infoBox.style.background = '#fff';
                infoBox.style.border = '1px solid #00f';
                infoBox.style.borderRadius = '4px';
                infoBox.style.padding = '4px 8px';
                infoBox.style.fontSize = '12px';
                infoBox.style.fontFamily = 'monospace';
                infoBox.style.pointerEvents = 'none';
                infoBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                document.body.appendChild(infoBox);
            }
            function showInfoBox(e) {
                if (!infoBox) createInfoBox();
                const el = e.target;
                let info = el.tagName.toLowerCase();
                if (el.id) info += ' #' + el.id;
                if (el.className) info += ' .' + el.className.trim().replace(/\\s+/g, '.');
                infoBox.textContent = info;
                const rect = el.getBoundingClientRect();
                infoBox.style.top = (rect.top + window.scrollY + 4) + 'px';
                infoBox.style.left = (rect.left + window.scrollX + 4) + 'px';
                infoBox.style.display = 'block';
            }
            function hideInfoBox() {
                if (infoBox) infoBox.style.display = 'none';
            }
            function highlight(e) {
                if (last) last.style.outline = '';
                last = e.target;
                last.style.outline = '2px solid #00f';
                showInfoBox(e);
            }
            function unhighlight(e) {
                if (last) last.style.outline = '';
                last = null;
                hideInfoBox();
            }
            function getComputedStyles(el) {
                const computed = window.getComputedStyle(el);
                const defaultEl = document.createElement(el.tagName);
                document.body.appendChild(defaultEl);
                const defaultComputed = window.getComputedStyle(defaultEl);
                let styles = '';
                for (let i = 0; i < computed.length; i++) {
                    const prop = computed[i];
                    if (computed.getPropertyValue(prop) !== defaultComputed.getPropertyValue(prop)) {
                        styles += prop + ':' + computed.getPropertyValue(prop) + ';';
                    }
                }
                document.body.removeChild(defaultEl);
                return styles;
            }
            function select(e) {
                e.preventDefault();
                e.stopPropagation();
                unhighlight(e);
                window.parent.postMessage({
                    type: 'element-selected',
                    tag: e.target.tagName,
                    id: e.target.id,
                    class: e.target.className,
                    outerHTML: e.target.outerHTML,
                    style: getComputedStyles(e.target)
                }, '*');
            }
            document.querySelectorAll('*').forEach(el => {
                el.addEventListener('mouseover', highlight);
                el.addEventListener('mouseout', unhighlight);
                el.addEventListener('click', select);
            });
            window.__elementSelectorCleanup = function() {
                document.querySelectorAll('*').forEach(el => {
                    el.removeEventListener('mouseover', highlight);
                    el.removeEventListener('mouseout', unhighlight);
                    el.removeEventListener('click', select);
                    el.style.outline = '';
                });
                if (infoBox && infoBox.parentNode) {
                    infoBox.parentNode.removeChild(infoBox);
                    infoBox = null;
                }
            };
        })();
    `;
    doc.body.appendChild(script);
}

function removeSelectionScript() {
    const iframe = document.getElementById('iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;
    if (doc.defaultView && doc.defaultView.__elementSelectorCleanup) {
        doc.defaultView.__elementSelectorCleanup();
    }
    if (doc.body) {
        const script = doc.getElementById(scriptId);
        if (script) doc.body.removeChild(script);
    }
}

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'element-selected') {
        selectedElementInfo.value = event.data;
        cssProps.value = parseInitialStyles(event.data.style, cssConfig);
        selectMode.value = false;
        removeSelectionScript();
    }
});

function closeStyleEditor() {
    selectedElementInfo.value = null;
}

function applyLiveCSS() {
    const iframe = document.getElementById('iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc || !selectedElementInfo.value) return;
    let el = null;
    if (selectedElementInfo.value.id) el = doc.getElementById(selectedElementInfo.value.id);
    if (!el) {
        const candidates = Array.from(doc.getElementsByTagName(selectedElementInfo.value.tag));
        el = candidates.find(e => e.outerHTML === selectedElementInfo.value.outerHTML) || candidates[0];
    }
    if (!el) return;
    applyCssProps(el, cssProps.value);
}

(async ()=>{
    const html = await fetch('./default.html').then(res => res.text());
    loadHTMLToIframe(html);
})();

function exportHTML(type) {
    const html = getHTMLFromIframe();
    if (type == 'download') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'page.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (type == 'copy') {
        navigator.clipboard.writeText(html)
            .then(() => {
                alert('HTML copied to clipboard');
            }).catch(err => {
                alert('Failed to copy HTML: ' + err);
        });
    }
}

async function importHTML(type) {
    if (type == 'upload') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.html,text/html';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const text = await file.text();
                loadHTMLToIframe(text);
            }
        };
        input.click();
        modal.value = '';
    } else if (type == 'paste') {
        const text = await navigator.clipboard.readText();
        loadHTMLToIframe(text);
    }
}

// mount Vue
createApp({
    setup() {
        return {
            modal,
            exportHTML,
            importHTML,
            startSelectMode,
            selectedElementInfo,
            cssProps,
            cssConfig,
            applyLiveCSS,
            closeStyleEditor,
        };
    }
}).mount('body');