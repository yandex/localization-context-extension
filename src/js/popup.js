import '../css/popup.css';
import { saveAs } from 'file-saver';
import * as JSZip from 'jszip';
import storage from './storage';

const downloadButton = document.getElementById('download');
const clearButton = document.getElementById('clear');
const showButton = document.getElementById('show');
const amountImagesContainer = document.getElementById('amountImages');
const imagesContainer = document.getElementById('images');
const previewContainer = document.getElementById('preview');

init();

async function init() {
    updateInfo();
    setInterval(updateInfo, 1000);
}

// Handler for download all pictures
downloadButton.onclick = async function () {
    const screenshots = await storage.getList({withDataUrl: true});

    const zip = new JSZip();

    Object.keys(screenshots).forEach(key => {
        const value = screenshots[key];
        zip.file(`${key}.jpeg`, value.replace('data:image/jpeg;base64,', ''), {base64: true});
    });

    const content = await zip.generateAsync({type: "blob"});

    saveAs(content, "images.zip");
};

clearButton.onclick = async function () {
    await storage.clear();
};

showButton.onclick = async () => {
    const screenshots = await storage.getList();

    imagesContainer.innerHTML = '';
    Object.keys(screenshots).forEach(key => {
        const imageItem = document.createElement('div');
        imageItem.classList.add('imageItem');

        const valueElement = document.createElement('span');
        valueElement.innerHTML = key;

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = 'delete';

        imageItem.appendChild(valueElement);
        imageItem.appendChild(deleteButton);
        imagesContainer.appendChild(imageItem);

        deleteButton.onclick = async () => {
            const previewLabel = previewContainer.getElementsByTagName('div');

            if (
                previewLabel.length > 0 &&
                previewLabel[0].innerHTML === key
            ) {
                previewContainer.innerHTML = '';
            }

            imagesContainer.removeChild(imageItem);

            await storage.delete(key);
            updateInfo();
        }

        valueElement.onclick = async () => {
            const srceenshotSrc = await storage.get(key);
            const image = document.createElement('img');

            image.classList.add('image');
            image.src = srceenshotSrc;

            const labelElement = document.createElement('div');
            labelElement.innerHTML = key;

            previewContainer.innerHTML = '';
            previewContainer.appendChild(labelElement);
            previewContainer.appendChild(image);
        };
    });
};

async function updateInfo () {
    const screenshots = await storage.getList();
    const amount = Object.keys(screenshots).length;

    amountImagesContainer.innerHTML = `Collected ${amount} pictures`;
}
