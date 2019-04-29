/**
 * Контентный скрипт имеет доступ к DOM страницы, поэтому тут происходит
 * основная часть работы.
 */

// режим скриншотинга
let makingScreenshots = false;
// обьект ключ:скриншот в формате base64
// const screenshots = {};

const LS_NAME = 'intlMessages';
const FIRST_RUN_TIMEOUT = 2000;
const RUN_TIMEOUT = 500;

init();

chrome.store.onChanged.addListener((...args) => {
    /* eslint-disable no-console */
    console.log(args);
})

function init() {
    if (!localStorage.getItem(LS_NAME)) {
        return;
    }

    setTimeout(run, FIRST_RUN_TIMEOUT);
}

function run() {
    // пока идет скрининг не начинаем делать лишних запусков скрининга
    if (!makingScreenshots) {
        const messages = JSON.parse(localStorage.getItem(LS_NAME));
        const newMessages = {};
    
        chrome.storage.local.get(['screenshots'], ({screenshots}) => {
            // фильтруем ключи и откидываем те на которые уже есть скрины
            Object.keys(messages).forEach(key => {
                if (!screenshots[key]) {
                    newMessages[key] = messages[key];
                }
            });

            // получаем обьект ключ:дом нода
            const elements = findDomElementsWithIntlData(newMessages);

            if (Object.keys(elements).length >= 1) {
                makingScreenshots = true;
                makeScreenshots(elements);
            }
        });
    }

    setTimeout(run, RUN_TIMEOUT);
}

/**
 * рекурсивная функция которая подсвечивает ноду, делает запрос на скриншот
 * убирает подстветку и запускает скрин след. ноды
 * сделано через рекурсию, потому что скриншот делается асинхронно
 * @param {Object} elements 
 * @param {Number} index 
 */
function makeScreenshots(elements, index = 0) {
    const keys = Object.keys(elements);
    const key = keys[index];
    const domElement = elements[key];
    const background = domElement.style.background;

    domElement.style.background = 'rgba(256, 0, 0, 0.3)';

    chrome.runtime.sendMessage({ type: 'MAKE_SCREENSHOT' }, ({ dataUrl }) => {
        chrome.storage.local.get(['screenshots'], ({screenshots}) => {
            screenshots[key] = dataUrl;
            chrome.storage.local.set({screenshots}, () => {
                domElement.style.background = background;
        
                if (index < keys.length - 1) {
                    makeScreenshots(elements, index + 1);
                } else {
                    makingScreenshots = false;
                }
            });
        });
    });
};

/**
 * Синхронизируем стор
 * @param {Object} screenshots 
 */
function syncStorage(newScreenshots) {
    chrome.storage.local.get(['screenshots'], ({screenshots: storageScreenshots}) => {
        chrome.storage.local.set({
            screenshots: {
                ...storageScreenshots,
                ...newScreenshots
            }
        });
    });
}

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
 * видит ли пользователь переданный DomElement на странице в данный момент
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
