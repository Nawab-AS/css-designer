const { createApp, ref, watch } = Vue;



// dynamic HTML
const pageHTML = ref('');
const modal = ref('');
const selectMode = ref(false);
const selectedElementInfo = ref(null);
const liveCSS = ref('');
watch(pageHTML, (newHTML) => {
    const iframe = document.getElementById('iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const newHTML2 = newHTML.replace(/<script.*?<\/script>/gis, ''); // remove script tags to prevent XSS
    modal.value = newHTML != newHTML2 ? 'XSSWarning' : '';
    doc.open();
    doc.write(newHTML2);
    doc.close();

    setTimeout(() => {
        if (selectMode.value) injectSelectionScript();
    }, 100);
});
// Selection mode logic
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
            function highlight(e) {
                if (last) last.style.outline = '';
                last = e.target;
                last.style.outline = '2px solid #00f';
            }
            function unhighlight(e) {
                if (last) last.style.outline = '';
                last = null;
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
        liveCSS.value = event.data.style || '';
        selectMode.value = false;
        removeSelectionScript();
    }
});

function clearSelectedElement() {
    selectedElementInfo.value = null;
    liveCSS.value = '';
}

function applyLiveCSS() {
    const iframe = document.getElementById('iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc || !selectedElementInfo.value) return;
    let el = null;
    if (selectedElementInfo.value.id) {el = doc.getElementById(selectedElementInfo.value.id)}
    if (!el) {
        const candidates = Array.from(doc.getElementsByTagName(selectedElementInfo.value.tag));
        el = candidates.find(e => e.outerHTML === selectedElementInfo.value.outerHTML) || candidates[0];
    }
    if (el) {
        el.style.cssText = liveCSS.value;
    }
}
(async ()=>{
    pageHTML.value = (await fetch('./default.html').then(res => res.text())).replace(/<script.*?<\/script>/gis, '');
})();

function exportHTML(type) {
    if (type == 'download') {
        const blob = new Blob([pageHTML.value], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'page.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (type == 'copy') {
        navigator.clipboard.writeText(pageHTML.value)
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
                pageHTML.value = text;
            }
        };
        input.click();
        modal.value = '';
    } else if (type == 'paste') {
        pageHTML.value = await navigator.clipboard.readText();
    }
}

// mount Vue
createApp({
    setup() {
        return {
            pageHTML,
            modal,
            exportHTML,
            importHTML,
            startSelectMode,
            selectedElementInfo,
            liveCSS,
            applyLiveCSS,
            clearSelectedElement
        };
    }
}).mount('body');