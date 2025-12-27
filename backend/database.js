const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.userCollection = null;
        this.pdfCollection = null;
        this.draftsCollection = null;
        this.submissionsCollection = null;
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
                this.draftsCollection = this.db.collection("drafts");
                this.submissionsCollection = this.db.collection("submissions");
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

    createUser(user) {
        return this.userCollection.insertOne(user);
    }

    findUser(email, password, role) {
        return this.userCollection.findOne({ email: email, password: password, role: role });
    }

    async getUserPdfs(uid) {
        const results = await this.pdfCollection.find({
            $or: [
                { createdBy: uid },
                { accessList: uid }
            ]
        }).toArray();

        return results;
    }

    getPdfById(pdfId) {
        let objectId = new ObjectId(pdfId);
        return this.pdfCollection.findOne({ _id: objectId });
    }

    createPdf(pdf) {
        return this.pdfCollection.insertOne(pdf);
    }

    async deletePdf(pdfId) {
        let objectId = new ObjectId(pdfId);
        await this.pdfCollection.deleteOne({ _id: objectId });
    }

    updatePdfConfig(pdfId, config) {
        let objectId = new ObjectId(pdfId);
        return this.pdfCollection.updateOne(
            { _id: objectId },
            { $set: { config: config } }
        );
    }

    savePdfDraft(pdfId, uid, values) {
        return this.draftsCollection.insertOne({
            pdfId: pdfId,
            values: values,
            createdAt: new Date(),
            createdBy: uid
        });
    }

    savePdfSubmission(pdfId, uid, values) {
        return this.submissionsCollection.insertOne({
            pdfId: pdfId,
            values: values,
            createdAt: new Date(),
            createdBy: uid
        });
    }

    getPdfSubmissions(pdfId) {
        return this.submissionsCollection.find({ pdfId: pdfId }).toArray();
    }

    getPdfUserDrafts(pdfId, uid) {
        return this.draftsCollection.find({ pdfId: pdfId, createdBy: uid }).toArray();
    }
    
    getPdfUserSubmissions(pdfId, uid) {
        return this.submissionsCollection.find({ pdfId: pdfId, createdBy: uid }).toArray();
    }

    getPdfVersionById(versionId, uid) {
        let objectId = new ObjectId(versionId);
        return this.draftsCollection.findOne({ _id: objectId, createdBy: uid })
            .then(draft => {
                if (draft) return draft;
                return this.submissionsCollection.findOne({ _id: objectId, createdBy: uid });
            });
    }

    getPdfSubmissionById(submissionId) {
        let objectId = new ObjectId(submissionId);
        return this.submissionsCollection.findOne({ _id: objectId });
    }
}

exports.database = new Database();