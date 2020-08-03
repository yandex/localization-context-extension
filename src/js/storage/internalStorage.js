import { getStorage, setStorage } from '../utils/promisify';

class InternalStorage {
    async getList(props = {}) {
        const {screenshots} = await getStorage(['screenshots']);

        return screenshots || {};
    }

    async get(key) {
        const screenshots = await this.getList();

        return screenshots[key];
    }

    async _set(screenshots) {
        return setStorage({screenshots});
    }

    async add(key, dataUrl) {
        const screenshots = await this.getList();

        screenshots[key] = dataUrl;

        return this._set(screenshots);
    }

    async clear() {
        return this._set({});
    }

    async delete(key) {
        const screenshots = await this.getList();

        delete screenshots[key];

        return this._set(screenshots);
    }
}

export default InternalStorage;
