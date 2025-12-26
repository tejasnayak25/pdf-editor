const { put } = require("@vercel/blob");

class Storage {
    constructor() {
    }

    async uploadFile(name, file) {
        const fileData = await put(name, file, {
            access: "public"
        });
        return fileData.url;
    }
}

exports.storage = new Storage();