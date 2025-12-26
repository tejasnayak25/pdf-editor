const { MongoClient, ServerApiVersion } = require("mongodb");

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.userCollection = null;
        this.pdfCollection = null;
        this.connectPromise = null;
    }

    async connect() {
        const isOpen = this.client?.topology?.s?.state === "connected";
        if (isOpen) return;

        if (this.connectPromise) {
            return this.connectPromise;
        }

        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            throw new Error("MONGO_URL env var is not set");
        }

        this.client = new MongoClient(mongoUrl, {
            serverApi: { version: ServerApiVersion.v1 },
            serverSelectionTimeoutMS: 5000
        });

        this.connectPromise = this.client.connect()
            .then(client => {
                this.db = client.db("pdf-editor");
                this.userCollection = this.db.collection("users");
                this.pdfCollection = this.db.collection("pdfs");
                console.log("Connected to MongoDB");
            })
            .catch(error => {
                console.error("Error connecting to MongoDB:", error);
                
                this.client = null;
                throw error;
            })
            .finally(() => {
                this.connectPromise = null;
            });

        return this.connectPromise;
    }

    async getUserPdfs(email) {
        const results = await this.pdfCollection.find({
            $or: [
                { createdBy: email },
                { accessList: email }
            ]
        }).toArray();

        return results;
    }

    createPdf(pdf) {
        return this.pdfCollection.insertOne(pdf);
    }
}

exports.database = new Database();