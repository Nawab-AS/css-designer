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