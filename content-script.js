/**
 * Контентный скрипт имеет доступ к DOM страницы, поэтому тут происходит
 * основная часть работы.
 */


const LS_NAME = 'intlMessages';
const FIRST_RUN_TIMEOUT = 2000;
const RUN_TIMEOUT = 500;
const SLEEP_TIMEOUT = 50;
const BACKGROUND_ELEMENT = 'rgba(256, 0, 0, 0.3)';

init();

function init() {
    if (!localStorage.getItem(LS_NAME)) {
        return;
    }

    setTimeout(run, FIRST_RUN_TIMEOUT);
}

/**
 * Функция запускает бесконечный цикл в котором запускается процесс поиска элементов
 * и их скрининг
 */
async function run() {
    while (true) {
        const messages = JSON.parse(localStorage.getItem(LS_NAME));
        const newMessages = {};
    
        const {screenshots} = await getStorage('screenshots');
    
        // фильтруем ключи и откидываем те на которые уже есть скрины
        Object.keys(messages).forEach(key => {
            if (!screenshots[key]) {
                newMessages[key] = messages[key];
            }
        });
    
        // получаем обьект ключ:дом нода
        const elements = findDomElementsWithIntlData(newMessages);
    
        for (key in elements) {
            await makeScreenshot(elements[key]);
        }

        await sleep(RUN_TIMEOUT);
    }
}

/**
 * Рекурсивная функция которая подсвечивает ноду, делает запрос на скриншот
 * убирает подстветку и запускает скрин след. ноды
 * сделано через рекурсию, потому что скриншот делается асинхронно
 * @param {DOMElement} element
 */
async function makeScreenshot(element) {
    const background = element.style.background;

    element.style.background = BACKGROUND_ELEMENT;
    await sleep(SLEEP_TIMEOUT);

    const {dataUrl} = await sendMessage({ type: 'MAKE_SCREENSHOT' });
    const {screenshots} = await getStorage('screenshots');

    screenshots[key] = dataUrl;
    await setStorage({screenshots});

    element.style.background = background;
    await sleep(SLEEP_TIMEOUT);
};

/**
 * метод ищет формирует обьект ключ:дом нода на основе обьекта ключ:значение
 * через XPath
 * @param {Object} messages 
 */
function findDomElementsWithIntlData(messages) {
    const elements = {};

    Object.keys(messages).forEach(key => {
        const message = messages[key];

        const element = document.evaluate(
            `//*[text()="${message}"]`,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
        ).snapshotItem(0);

        if (element && checkElementVisibility(element)) {
            elements[key] = element;
        }
    });

    return elements;
};

/**
 * Адская функция которая пытается ответить на вопрос,
 * видит ли пользователь переданный DOMElement на странице в данный момент
 * 
 * @param {DOMElement} element 
 */
function checkElementVisibility(element) {
    const rect = element.getBoundingClientRect();
    const minBorder = window.pageYOffset;
    const maxBorder = window.pageYOffset + document.documentElement.clientHeight;

    // проверяем чтобы нода была в пределах видимой части страницы
    if (
        window.pageYOffset + rect.top < minBorder ||
        window.pageYOffset + rect.bottom > maxBorder
    ) {
        return false;
    }

    let checkingElement = element;

    while (checkingElement) {
        const computedStyles = getComputedStyle(checkingElement);

        if (
            parseFloat(computedStyles.opacity) < 0.2 ||
            computedStyles.display === 'none' ||
            computedStyles.visibility === 'hidden'
        ) {
            return false;
        }

        checkingElement = checkingElement.parentElement;
    }

    return true;
}

// Промисифицированные функции для хром апи:

function getStorage(name) {
    return new Promise(resolve => {
        chrome.storage.local.get([name], result => {
            resolve(result);
        });
    });
}

function setStorage(data) {
    return new Promise(resolve => {
        chrome.storage.local.set(data, () => {
            resolve();
        });
    });
}

function sleep(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
}

function sendMessage(data) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage(data, resultData => {
            resolve(resultData);
        });
    });
}
