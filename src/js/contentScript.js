/**
 * Контентный скрипт имеет доступ к DOM страницы, поэтому тут происходит
 * основная часть работы.
 */

import {
    getSyncStorage,
    sleep,
    sendMessage
} from './utils/promisify';

import storage from './storage';
import * as CONSTANTS from './constants';

let localStorageKey;
let tempBackground;
let s3accessKeyId = '';
let s3accessSecretKey = '';

init();

async function init() {
    const data = await getSyncStorage({
        localStorageKey: CONSTANTS.DEFAULT_LS_NAME,
        background: CONSTANTS.DEFAULT_BACKGROUND_ELEMENT,
        s3accessKeyId,
        s3accessSecretKey,
        uploadWaySelectValue: CONSTANTS.DEFAULT_UPLOAD,
    });

    localStorageKey = data.localStorageKey;
    tempBackground = data.background;

    if (!localStorage.getItem(localStorageKey)) {
        console.info(`Key ${localStorageKey} not found.`);
        return;
    }

    setTimeout(run, CONSTANTS.FIRST_RUN_TIMEOUT);
}

/**
 * Функция запускает бесконечный цикл
 * в котором запускается процесс поиска элементов и скриниг
 */
async function run() {
    while (true) {
        const messages = JSON.parse(localStorage.getItem(localStorageKey));
        const newMessages = {};
        const screenshots = await storage.getList();

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

        await sleep(CONSTANTS.RUN_TIMEOUT);
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
    await sleep(CONSTANTS.SLEEP_TIMEOUT);

    const {dataUrl} = await sendMessage({ type: 'MAKE_SCREENSHOT' });

    await storage.add(key, dataUrl);

    element.style.background = background;
    await sleep(CONSTANTS.SLEEP_TIMEOUT);
}

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
