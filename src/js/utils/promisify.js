const promisify = (func, context, data) => new Promise(resolve => func.call(context, data, resolve));

const getStorage = (data) => promisify(chrome.storage.local.get, chrome.storage.local, data);
const getSyncStorage = (data) => promisify(chrome.storage.sync.get, chrome.storage.sync, data);
const setStorage = (data) => promisify(chrome.storage.local.set, chrome.storage.local, data);
const setSyncStorage = (data) => promisify(chrome.storage.sync.set, chrome.storage.sync, data);
const sendMessage = (data) => promisify(chrome.runtime.sendMessage, chrome.runtime, data);

const sleep = (time) =>  new Promise(resolve => {setTimeout(resolve, time)});

export {
    getSyncStorage,
    getStorage,
    setSyncStorage,
    setStorage,
    sleep,
    sendMessage
};
