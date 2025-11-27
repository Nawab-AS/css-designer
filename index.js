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
let selectElementScript = '';
fetch('selectElement.js')
    .then(res => res.text())
    .then(text => {selectElementScript = text;})
    .catch(err => {console.error('Failed to load selectElement.js:', err)});

const scriptId = Math.random().toString(36).slice(2);
function injectSelectionScript() {
    const iframe = document.getElementById('iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;
    removeSelectionScript();
    const script = doc.createElement('script');
    script.id = scriptId;
    script.textContent = selectElementScript;
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