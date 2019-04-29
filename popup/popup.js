const downloadButton = document.getElementById('download');
const clearButton = document.getElementById('clear');
const showButton = document.getElementById('show');
const amountImagesContainer = document.getElementById('amountImages');
const imagesContainer = document.getElementById('images');
const previewContainer = document.getElementById('preview');

updateInfo();

downloadButton.onclick = function (element) {
    chrome.storage.local.get(['screenshots'], function ({screenshots}) {
        var zip = new JSZip();

        Object.keys(screenshots).forEach(key => {
            const value = screenshots[key];
            zip.file(`${key}.jpeg`, value.replace('data:image/jpeg;base64,', ''), {base64: true});
        });

        zip.generateAsync({ type: "blob" }).then(function (content) {
            // see libs/file-saver.js
            saveAs(content, "images.zip");
        });
    });
};

clearButton.onclick = function () {
    chrome.storage.local.set({ screenshots: {} });
};

showButton.onclick = function () {
    chrome.storage.local.get(['screenshots'], function ({screenshots}) {
        imagesContainer.innerHTML = '';
        Object.keys(screenshots).forEach(key => {
            const imageItem = document.createElement('div');
            imageItem.classList.add('imageItem');

            const valueElement = document.createElement('span');
            valueElement.innerHTML = key;

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = 'Удалить';

            imageItem.appendChild(valueElement);
            imageItem.appendChild(deleteButton);
            imagesContainer.appendChild(imageItem);

            deleteButton.onclick = function () {
                const previewLabel = previewContainer.getElementsByTagName('div');

                if (
                    previewLabel.length > 0 &&
                    previewLabel[0].innerHTML === key
                ) {
                    previewContainer.innerHTML = '';
                }

                imagesContainer.removeChild(imageItem);

                delete screenshots[key];
                chrome.storage.local.set({ screenshots }, updateInfo);
            }

            valueElement.onclick = () => {
                const image = document.createElement('img');
                image.classList.add('image');
                image.src = screenshots[key];

                const labelElement = document.createElement('div');
                labelElement.innerHTML = key;

                previewContainer.innerHTML = '';
                previewContainer.appendChild(labelElement);
                previewContainer.appendChild(image);
            };
        });
    });
};

function updateInfo () {
    chrome.storage.local.get(['screenshots'], function ({screenshots}) {
        const amount = Object.keys(screenshots).length;
        amountImagesContainer.innerHTML = `Собрано ${amount} картинок`;
    });
}
