const promisify = (func, data) => new Promise(resolve => {func(data, resolve)});

const getStorage = (data) => promisify(chrome.storage.local.get, data);
const getSyncStorage = (data) => promisify(chrome.storage.sync.get, data);
const setStorage = (data) => promisify(chrome.storage.local.set, data);
const setSyncStorage = (data) => promisify(chrome.storage.sync.set, data);
const sendMessage = (data) => promisify(chrome.runtime.sendMessage, data);

const sleep = (time) =>  new Promise(resolve => {setTimeout(resolve, time)});

export {
    getSyncStorage,
    getStorage,
    setSyncStorage,
    setStorage,
    sleep,
    sendMessage
};
