import AWS from 'aws-sdk';

import { getSyncStorage } from '../utils/promisify';
import { getDataUrlFromUnit8Array } from '../utils/getDataUrlFromUnit8Array';
import { base64toBlob } from '../utils/base64ToBlob';

class S3Storage {
    async getS3() {
        if (this.s3) {
            return this.s3;
        }

        const {
            s3accessKeyId,
            s3accessSecretKey,
            s3url,
            s3bucket,
            s3folder
        } = await getSyncStorage(['s3accessKeyId', 's3accessSecretKey', 's3url', 's3bucket', 's3folder']);

        this.s3 = new AWS.S3({
            endpoint: s3url,
            accessKeyId: s3accessKeyId,
            secretAccessKey: s3accessSecretKey
        });

        this.bucket = s3bucket;
        this.folder = s3folder;

        return this.s3;
    }

    async getList({ withDataUrl } = { withDataUrl: false}) {
        const s3 = await this.getS3();

        const params = {
            Bucket: this.bucket,
            Prefix: this.folder
        };

        return new Promise((resolve, reject) => {
            s3.listObjectsV2(params, (async function(err, data) {
                if (err) {
                    console.error(err.stack);
                    reject(err);
                } else {
                    const keys = data.Contents
                        .filter(object => object.Size)
                        .map(object => object.Key.replace(`${this.folder}/`, '').replace('.jpeg', ''));

                    if (!withDataUrl) {
                        const result = keys.reduce((obj, key) => {
                            obj[key] = true;

                            return obj;
                        }, {});

                        return resolve(result)
                    }

                    const screenshotPromises = keys.map(key => this.get(key).then(dataUrl => [key, dataUrl]));
                    const screenshotEntries = await Promise.all(screenshotPromises);
                    const result = Object.fromEntries(screenshotEntries);

                    resolve(result);
                }
            }).bind(this));
        });
    }

    async get(key, isOriginalkey = false) {
        const s3 = await this.getS3();

        const params = {
            Bucket: this.bucket,
            Key: isOriginalkey ? key : `${this.folder}/${key}.jpeg`,
        };

        return new Promise((resolve, reject) => {
            s3.getObject(params, function(err, data) {
                if (err) {
                    console.error(err, err.stack);
                    reject(err);
                } else {
                    const {Body} = data;
                    const screenshotDataUrl = getDataUrlFromUnit8Array(Body);

                    resolve(screenshotDataUrl);
                }
            });
        });
    }

    async add(key, dataUrl) {
        const s3 = await this.getS3();

        const params = {
            Bucket: this.bucket,
            Key: `${this.folder}/${key}.jpeg`,
            Body: base64toBlob(dataUrl.replace(/^data:image\/(jpeg);base64,/, ""), 'image/jpeg'),
            ContentType: 'image/jpeg'
        };

        return new Promise((resolve, reject) => {
            s3.putObject(params, function(err) {
                if (err) {
                    console.error('err', err.stack);
                    reject(err);
                } else {
                    resolve();
                }
            })
        });
    }

    async clear() {
        const s3 = await this.getS3();

        const params = {
            Bucket: this.bucket,
            Delete: { Objects: [] },
        };

        const list = Object.keys(await this.getList());

        if (list.length === 0) return;

        list.forEach((key) => {
            params.Delete.Objects.push({ Key: `${this.folder}/${key}.jpeg` });
        });

        return new Promise((resolve, reject) => {
            s3.deleteObjects(params, function(err, data) {
                if (err) {
                    console.error('err', err.stack);
                    reject(err);
                } else {
                    const deletedCount = data.Deleted.length;

                    if (deletedCount !== list.length) {
                        console.log('Not all items were deleted');
                    }

                    resolve();
                }
            })
        });
    }

    async delete(key) {
        const s3 = await this.getS3();

        const params = {
            Bucket: this.bucket,
            Key: `${this.folder}/${key}.jpeg`,
        };

        return new Promise((resolve, reject) => {
            s3.deleteObject(params, function(err) {
                if (err) {
                    console.error('err', err.stack);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

export default S3Storage;
