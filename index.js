const { createApp, ref, watch } = Vue;



// dynamic HTML
const pageHTML = ref('');
const modal = ref('');
watch(pageHTML, (newHTML) => {
    const iframe = document.getElementById('page');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    newHTML2 = newHTML.replace(/<script.*?<\/script>/gis, ''); // remove script tags to prevent XSS
    modal.value = newHTML != newHTML2 ? 'XSSWarning' : '';
    doc.open();
    doc.write(newHTML2);
    doc.close();
});


// mount Vue
createApp({
    setup() {
        return { pageHTML, modal };
    }
}).mount('body');