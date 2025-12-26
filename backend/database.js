const { MongoClient, ServerApiVersion } = require("mongodb");

class Database {
    constructor() {
        this.client = new MongoClient(process.env.MONGO_URL, {
            serverApi: {
                version: ServerApiVersion.v1
            }
        });
        
        this.db = this.client.db("pdf-editor");
        this.userCollection = this.db.collection("users");
        this.pdfCollection = this.db.collection("pdfs");
    }

    async connect() {
        try {
            await this.client.connect();
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error("Error connecting to MongoDB:", error);
        }
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