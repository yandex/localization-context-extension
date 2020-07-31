export function getDataUrlFromUnit8Array(arrayBuffer) {
    const base64String = btoa(new Uint8Array(arrayBuffer).reduce((data, byte)=> {
        return data + String.fromCharCode(byte);
    }, ''));

    return `data:image/jpeg;base64,` + base64String;
}

