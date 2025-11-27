const { createApp, ref, watch } = Vue;



// dynamic HTML
const pageHTML = ref('');
const modal = ref('');
watch(pageHTML, (newHTML) => {
    const iframe = document.getElementById('iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const newHTML2 = newHTML.replace(/<script.*?<\/script>/gis, ''); // remove script tags to prevent XSS
    modal.value = newHTML != newHTML2 ? 'XSSWarning' : '';
    doc.open();
    doc.write(newHTML2);
    doc.close();
});
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
        return { pageHTML, modal, exportHTML, importHTML };
    }
}).mount('body');