/**
 * Контентный скрипт имеет доступ к DOM страницы, поэтому тут происходит
 * основная часть работы.
 */

import {
    getStorage,
    getSyncStorage,
    setStorage,
    sleep,
    sendMessage
} from './utils/promisify';

const DEFAULT_LS_NAME = 'intlMessages';
const FIRST_RUN_TIMEOUT = 2000;
const RUN_TIMEOUT = 500;
const SLEEP_TIMEOUT = 50;
const DEFAULT_BACKGROUND_ELEMENT = 'rgba(256, 0, 0, 0.3)';

let localStorageKey;
let tempBackground;

init();

async function init() {
    const data = await getSyncStorage({
        localStorageKey: DEFAULT_LS_NAME,
        background: DEFAULT_BACKGROUND_ELEMENT,
    });

    localStorageKey = data.localStorageKey;
    tempBackground = data.background;

    if (!localStorage.getItem(localStorageKey)) {
        console.info(`Key ${localStorageKey} not found.`);
        return;
    }

    setTimeout(run, FIRST_RUN_TIMEOUT);
}

/**
 * Функция запускает бесконечный цикл
 * в котором запускается процесс поиска элементов и скриниг
 */
async function run() {
    while (true) {
        const messages = JSON.parse(localStorage.getItem(localStorageKey));
        const newMessages = {};
    
        const {screenshots} = await getStorage(['screenshots']);
    
        // фильтруем ключи и откидываем те на которые уже есть скрины
        Object.keys(messages).forEach(key => {
            if (!screenshots[key]) {
                newMessages[key] = messages[key];
            }
        });
    
        // получаем обьект ключ:дом нода
        const elements = findDomElementsWithIntlData(newMessages);
    
        for (let key in elements) {
            await makeScreenshot(key, elements[key]);
        }

        await sleep(RUN_TIMEOUT);
    }
}

/**
 * Функция подсвечивает элемент и скринит его
 * @param {String} key
 * @param {DOMElement} element
 */
async function makeScreenshot(key, element) {
    const background = element.style.background;

    element.style.background = tempBackground;
    await sleep(SLEEP_TIMEOUT);

    const {dataUrl} = await sendMessage({ type: 'MAKE_SCREENSHOT' });
    const {screenshots} = await getStorage(['screenshots']);

    screenshots[key] = dataUrl;
    await setStorage({screenshots});

    element.style.background = background;
    await sleep(SLEEP_TIMEOUT);
};

/**
 * Функция формирует обьект Key:DOMElement
 * на основе обьекта Key:Value через XPath
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
