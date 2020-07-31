import '../css/options.css';
import {setSyncStorage, getSyncStorage, sleep} from './utils/promisify';
import * as CONSTANTS from './constants';

async function saveOptions() {
    const localStorageKey = document.getElementById('localStorageKey').value;
    const background = document.getElementById('background').value;
    const s3accessKeyId = document.getElementById('accessKeyId').value;
    const s3accessSecretKey = document.getElementById('accessSecretKey').value;
    const s3url = document.getElementById('s3-url').value;
    const s3bucket = document.getElementById('s3-bucket').value;
    const s3folder = document.getElementById('s3-folder').value;
    const uploadWaySelectValue = document.getElementById('upload-select').value;

    await setSyncStorage({
        localStorageKey: localStorageKey || CONSTANTS.DEFAULT_LS_NAME,
        background: background || CONSTANTS.DEFAULT_BACKGROUND_ELEMENT,
        s3accessKeyId,
        s3accessSecretKey,
        uploadWaySelectValue,
        s3url,
        s3bucket,
        s3folder,
    });

    const status = document.getElementById('status');
    status.textContent = 'Options saved. Please, refresh the application page to apply changes.';
    await sleep(2000);
    status.textContent = '';
}

async function restoreOptions() {
    const {
        background, localStorageKey, s3accessKeyId, s3accessSecretKey,
        uploadWaySelectValue, s3url, s3bucket, s3folder} = await getSyncStorage({
        localStorageKey: '',
        background: '',
        s3accessKeyId: '',
        s3accessSecretKey: '',
        uploadWaySelectValue: '',
        s3url: '',
        s3bucket: '',
        s3folder: '',
    });

    document.getElementById('localStorageKey').value = localStorageKey;
    document.getElementById('background').value = background;
    document.getElementById('accessKeyId').value = s3accessKeyId;
    document.getElementById('accessSecretKey').value = s3accessSecretKey;
    document.getElementById('s3-url').value = s3url;
    document.getElementById('s3-bucket').value = s3bucket;
    document.getElementById('s3-folder').value = s3folder;

    const select = document.getElementById("upload-select");

    for (let i = 0; i < select.length; i++) {
        if (select.options[i].value === uploadWaySelectValue) {
            select.options[i].setAttribute("selected", "selected");
            select.value = select.options[i].value;
        } else {
            select.options[i].removeAttribute("selected");
        }
    }

    if (uploadWaySelectValue === 's3') {
        document.querySelector('.s3-controls').classList.add('s3-controls_visible');
    }
}

async function handleChangeUploadSelect(e) {
    const currentValue = e.target.value;

    if (currentValue === 's3') {
        document.querySelector('.s3-controls').classList.add('s3-controls_visible');

        return;
    }

    document.querySelector('.s3-controls').classList.remove('s3-controls_visible');
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('upload-select').addEventListener('change', handleChangeUploadSelect);
