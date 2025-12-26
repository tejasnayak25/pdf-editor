let express = require("express");
let app = express();
let multer = require("multer");
let cors = require("cors");
let database = require("./database").database;
let storage = require("./storage").storage;
let fs = require("fs");

app.use(cors());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

let env = process.env.ENV || "development";
let upload = env === "development"
    ? multer({ dest: "uploads/" })
    : multer({ storage: multer.memoryStorage() });

app.use(express.json());

app.post("/api/upload", upload.single("file"), async (req, res) => {
    let { name, description, accessList, createdBy } = req.body;
    accessList = JSON.parse(accessList || "[]");
    let file = req.file;
    console.log("Received upload:", { name, description, accessList, file });

    if (!file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
    }

    let filePath = "";

    try {
        if(env === "development") {
            filePath = { url: file.path, path: file.path };
        } else {
            filePath = await storage.uploadFile(`${createdBy}/${name}-${Date.now()}.pdf`, file);
        }
        
        await database.connect();

        await database.createPdf({
            name,
            description,
            accessList,
            file: {
                url: filePath.url,
                path: filePath.path
            },
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({ success: true, message: "File uploaded successfully" });
    } catch (error) {
        console.error("Error creating PDF:", error);
        res.status(500).json({ success: false, message: "Internal server error" + error });
        return;
    }
});

app.post("/api/delete-pdf", async (req, res) => {
    let { id, path, email } = req.body;

    if(!email) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }

    try {
        await database.connect();

        let pdf = await database.getPdfById(id);
        if(!pdf) {
            res.status(404).json({ success: false, message: "PDF not found" });
            return;
        }

        if(pdf.createdBy !== email) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }

        await database.deletePdf(id);

        if(env === "development") {
            fs.unlinkSync(path);
        } else {
            await storage.deleteFile(path);
        }
    } catch (error) {
        console.error("Error connecting to database:", error);
        res.status(500).json({ success: false, message: "Internal server error" + error });
        return;
    }
});

app.get("/api/user/:email", async (req, res) => {
    let email = req.params.email;
    try {
        await database.connect();
        
        let userPdfs = await database.getUserPdfs(email);
        if (userPdfs) {
            res.json({ success: true, user: { email, pdfs: userPdfs } });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: "Internal server error" + error });
    }
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});