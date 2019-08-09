import '../css/options.css';
import {setSyncStorage, getSyncStorage, sleep} from './utils/promisify';

async function saveOptions() {
    const localStorageKey = document.getElementById('localStorageKey').value;
    const background = document.getElementById('background').value;

    await setSyncStorage({
        localStorageKey,
        background
    });

    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    await sleep(750);
    status.textContent = '';
}

async function restoreOptions() {
    const {background, localStorageKey} = await getSyncStorage({
        localStorageKey: '',
        background: ''
    });

    document.getElementById('localStorageKey').value = localStorageKey;
    document.getElementById('background').value = background;
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
