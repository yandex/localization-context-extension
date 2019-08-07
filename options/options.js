// Сохраняем опции в chrome.storage 
function saveOptions() {
    const localStorageKey = document.getElementById('localStorageKey').value;
    const background = document.getElementById('background').value;
    chrome.storage.sync.set({
        localStorageKey,
        background
    }, function () {
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Восстанавливаем опции из chrome.storage
function restoreOptions() {
    chrome.storage.sync.get({
        localStorageKey: '',
        background: ''
    }, function ({background, localStorageKey}) {
        document.getElementById('localStorageKey').value = localStorageKey;
        document.getElementById('background').value = background;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
