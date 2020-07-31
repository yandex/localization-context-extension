/**
 * background скрипт умеет делать скриншоты
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'MAKE_SCREENSHOT') {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                chrome.tabs.captureVisibleTab(dataUrl => {
                    sendResponse({ dataUrl });
                });
            }
        );
    }

    // возвращая true мы говорим хрому, что callback будет асинхронным
    return true;
});
