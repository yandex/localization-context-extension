const downloadButton = document.getElementById('download');
const clearButton = document.getElementById('clear');
const amountImagesContainer = document.getElementById('amountImages');

chrome.storage.local.get(['screenshots'], function ({screenshots}) {
    const amount = Object.keys(screenshots).length;
    amountImagesContainer.innerHTML = `Собрано ${amount} картинок`;
});

downloadButton.onclick = function (element) {
    chrome.storage.local.get(['screenshots'], function ({screenshots}) {
        /* eslint-disable no-console */
        console.log(screenshots);
        var zip = new JSZip();

        Object.keys(screenshots).forEach(key => {
            const value = screenshots[key];
            zip.file(`${key}.jpeg`, value.replace('data:image/jpeg;base64,', ''), {base64: true});
        });

        zip.generateAsync({ type: "blob" }).then(function (content) {
            // see FileSaver.js
            saveAs(content, "images.zip");
        });
    });
};

clearButton.onclick = function () {
    chrome.storage.local.set({ screenshots: {} });
};
