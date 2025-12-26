const { put, del } = require("@vercel/blob");

class Storage {
    constructor() {
    }

    async uploadFile(name, file) {
        const fileData = await put(name, file.buffer, {
            access: "public"
        });
        return { url: fileData.url, path: name };
    }

    async deleteFile(path) {
        await del(path);
    }
}

exports.storage = new Storage();