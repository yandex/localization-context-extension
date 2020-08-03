import { getSyncStorage } from '../utils/promisify';
import { INTERNAL_STORAGE, S3_STORAGE } from '../constants';
import * as CONSTANTS from '../constants';

import InternalStorage from './internalStorage';
import S3Storage from './S3Storage';

class StorageRegistry {
    constructor() {
        this.storages = {};
        this.storages[INTERNAL_STORAGE] = new InternalStorage();
        this.storages[S3_STORAGE] = new S3Storage();
    }

    async getStorage() {
        const {
            s3accessKeyId,
            s3accessSecretKey,
            uploadWaySelectValue,
            s3url,
            s3bucket,
            s3folder
        } = await getSyncStorage([
            's3accessKeyId', 's3accessSecretKey', 'uploadWaySelectValue',
            's3url', 's3bucket', 's3folder'
        ]);
        const isEnabledS3 = uploadWaySelectValue === CONSTANTS.UPLOAD_WAYS.s3;
        const isS3Storage = isEnabledS3 && s3accessSecretKey && s3accessKeyId && s3url && s3bucket && s3folder;

        return this.storages[isS3Storage ? S3_STORAGE : INTERNAL_STORAGE];
    }

    async getList(...args) {
        const storage = await this.getStorage();

        return storage.getList(...args);
    }

    async get(...args) {
        const storage = await this.getStorage();

        return storage.get(...args);
    }

    async add(...args) {
        const storage = await this.getStorage();

        return storage.add(...args);
    }

    async clear(...args) {
        const storage = await this.getStorage();

        return storage.clear(...args);
    }

    async delete(...args) {
        const storage = await this.getStorage();

        return storage.delete(...args);
    }
}

export default new StorageRegistry();
