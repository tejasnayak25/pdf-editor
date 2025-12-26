let express = require("express");
let app = express();
let multer = require("multer");
let cors = require("cors");
let database = require("./database").database;
let storage = require("./storage").storage;

app.use(cors());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

let env = process.env.ENV || "development";
let upload = multer({ dest: env === "development" ? "uploads/" : "/tmp/" });

app.use(express.json());

database.connect();

app.post("/api/upload", upload.single("file"), async (req, res) => {
    let { name, description, accessList, createdBy } = req.body;
    accessList = JSON.parse(accessList || "[]");
    let file = req.file;
    console.log("Received upload:", { name, description, accessList, file });

    let filePath = "";

    if(env === "development") {
        filePath = file.path;
    } else {
        filePath = await storage.uploadFile(`${createdBy}/${name}-${Date.now()}`, file);
    }

    try {
        await database.createPdf({
            name,
            description,
            accessList,
            filePath: filePath,
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error creating PDF:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
        return;
    }

    res.json({ success: true, message: "File uploaded successfully" });
});

app.get("/api/user/:email", async (req, res) => {
    let email = req.params.email;
    try {
        let userPdfs = await database.getUserPdfs(email);
        if (userPdfs) {
            res.json({ success: true, user: { email, pdfs: userPdfs } });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});