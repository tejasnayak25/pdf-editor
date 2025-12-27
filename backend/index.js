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

if(env === "development") {
    if (!fs.existsSync("pdf-configs")) {
        fs.mkdirSync("pdf-configs");
    }
}

app.use(express.json());

app.post("/api/signup", async (req, res) => {
    let { email, password, role } = req.body;
    try {
        await database.connect();
        let existingUser = await database.findUser(email, password, role);
        if (existingUser) {
            res.json({ success: false, message: "User already exists" });
            return;
        }
        await database.createUser({ email, password, role });
        res.json({ success: true, message: "User created successfully" });
    } catch (error) {
        console.error("Error connecting to database:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
        return;
    }
});

app.post("/api/login", async (req, res) => {
    let { email, password, role } = req.body;
    try {
        await database.connect();
        let user = await database.findUser(email, password, role);
        if (user) {
            res.json({ success: true, user: { uid: user._id, email: user.email, role: user.role } });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Error connecting to database:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
        return;
    }
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
    let { name, description, accessList, createdBy } = req.body;
    accessList = JSON.parse(accessList || "[]");
    let file = req.file;

    if (!file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
    }

    if(file.mimetype !== "application/pdf") {
        res.status(400).json({ success: false, message: "Invalid file type. Only PDF files are allowed." });
        return;
    }

    if(file.size === 0) {
        res.status(400).json({ success: false, message: "Uploaded file is empty." });
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

        let pdf = await database.createPdf({
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

        res.json({ success: true, id: pdf.insertedId.toString(), message: "File uploaded successfully" });
    } catch (error) {
        console.error("Error creating PDF:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
        return;
    }
});

app.post("/api/delete-pdf", async (req, res) => {
    let { id, path, createdBy } = req.body;

    if(!createdBy) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }

    try {
        if(env === "development" && path.startsWith(storage.protocol)) {
            res.status(400).json({ success: false, message: "This pdf cannot be deleted in development mode" });
            return;
        }
        
        await database.connect();

        let pdf = await database.getPdfById(id);
        if(!pdf) {
            res.status(404).json({ success: false, message: "PDF not found" });
            return;
        }

        if(pdf.createdBy !== createdBy) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }

        await database.deletePdf(id);

        if(env === "development") {
            fs.unlinkSync(path);
        } else {
            await storage.deleteFile(path);
        }

        let configPath = pdf.config?.url;
        if(configPath) {
            if(env === "development" && configPath.startsWith(storage.protocol)) {
                res.status(400).json({ success: false, message: "This pdf config cannot be deleted in development mode" });
                return;
            }
            if(env === "development") {
                fs.unlinkSync(configPath);
            } else {
                await storage.deleteFile(configPath);
            }
        }

        res.json({ success: true, message: "PDF deleted successfully" });
    } catch (error) {
        console.error("Error connecting to database:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
        return;
    }
});

app.post("/api/pdfs/:pdfId", async (req, res) => {
    let pdfId = req.params.pdfId;
    let { mode, uid } = req.body;
    try {
        await database.connect();
        let pdf = await database.getPdfById(pdfId);
        if (pdf) {
            if (mode === 'edit' && pdf.createdBy === uid) {
                res.json({ success: true, pdf });
            } else if(mode === 'view' && (pdf.createdBy === uid || (pdf.accessList && pdf.accessList.includes(uid)))) {
                res.json({ success: true, pdf });
            } else {
                res.status(403).json({ success: false, message: "Access denied" });
            }
        } else {
            res.status(404).json({ success: false, message: "PDF not found" });
        }
    } catch (error) {
        console.error("Error fetching PDF:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.post("/api/save-pdf-config", async (req, res) => {
    let { pdf_id, pages, creator } = req.body;
    try {
        await database.connect();
        let pdf = await database.getPdfById(pdf_id);
        if (!pdf) {
            res.status(404).json({ success: false, message: "PDF not found" });
            return;
        }
        if (pdf.createdBy !== creator) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }

        let filePath;

        if(env === "development") {
            fs.writeFileSync(`pdf-configs/${pdf_id}.json`, JSON.stringify(pages, null, 2));
            filePath = { url: `pdf-configs/${pdf_id}.json`, path: `pdf-configs/${pdf_id}.json` };
        } else {
            let buffer = Buffer.from(JSON.stringify(pages, null, 2), 'utf-8');
            filePath = await storage.uploadFile(`pdf-configs/${pdf_id}.json`, { buffer });
        }

        await database.updatePdfConfig(pdf_id, filePath);
        res.json({ success: true, message: "PDF saved successfully" });
    }
    catch (error) {
        console.error("Error connecting to database:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
        return;
    }
});

app.post("/api/pdfs/:pdfId/save-draft", upload.any(), async (req, res) => {
    let pdfId = req.params.pdfId;
    let { userUid, values } = req.body;

    if (typeof values === "string") {
      values = JSON.parse(values);
    }

    try {
      await database.connect();

      const pdf = await database.getPdfById(pdfId);
      if (!pdf) {
        return res.status(404).json({ success: false, message: "PDF not found" });
      }

      if (!pdf.accessList?.includes(userUid)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const uploadedFiles = {};
      for (const file of req.files) {
        uploadedFiles[file.fieldname] = file;
      }

      for (const key of Object.keys(values)) {
        if (typeof values[key] === "string" && values[key].startsWith("file://")) {
            const file = uploadedFiles[key];

            if (file) {
                if (env === "development") {
                    values[key] = file.path;
                } else {
                    let uploadData = await storage.uploadFile(`pdf-files/${pdfId}/${userUid}/${Date.now()}/${file.originalname}`, file);
                    values[key] = uploadData.url;
                }
            }
        }
      }

      const result = await database.savePdfDraft(pdfId, userUid, values);

      res.json({
        success: true,
        id: result.insertedId,
        message: "Draft saved successfully"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.post("/api/pdfs/:pdfId/save-submission", upload.any(), async (req, res) => {
    let pdfId = req.params.pdfId;
    let { userUid, values } = req.body;

    if (typeof values === "string") {
      values = JSON.parse(values);
    }

    try {
      await database.connect();

      const pdf = await database.getPdfById(pdfId);
      if (!pdf) {
        return res.status(404).json({ success: false, message: "PDF not found" });
      }

      if (!pdf.accessList?.includes(userUid)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const uploadedFiles = {};
      for (const file of req.files) {
        uploadedFiles[file.fieldname] = file;
      }

      for (const key of Object.keys(values)) {
        if (typeof values[key] === "string" && values[key].startsWith("file://")) {
            const file = uploadedFiles[key];

            if (file) {
                if (env === "development") {
                    values[key] = file.path;
                } else {
                    let uploadData = await storage.uploadFile(`pdf-files/${pdfId}/${userUid}/${Date.now()}/${file.originalname}`, file);
                    values[key] = uploadData.url;
                }
            }
        }
      }

      const result = await database.savePdfSubmission(pdfId, userUid, values);

      res.json({
        success: true,
        id: result.insertedId,
        message: "Submission saved successfully"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.post("/api/pdfs/:pdfId/get-submissions", async (req, res) => {
    let pdfId = req.params.pdfId;
    let { creator } = req.body;
    try {
        await database.connect();
        let pdf = await database.getPdfById(pdfId);
        if (!pdf) {
            res.status(404).json({ success: false, message: "PDF not found" });
            return;
        }
        if (pdf.createdBy !== creator) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }
        let submissions = await database.getPdfSubmissions(pdfId);
        res.json({ success: true, submissions });
    } catch (error) {
        console.error("Error connecting to database:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
        return;
    }
});

app.post("/api/pdfs/:pdfId/get-user-drafts-submissions", async (req, res) => {
    let pdfId = req.params.pdfId;
    let { userUid } = req.body;
    try {
        await database.connect();
        let pdf = await database.getPdfById(pdfId);
        if (!pdf) {
            res.status(404).json({ success: false, message: "PDF not found" });
            return;
        }
        if (!(pdf.accessList && pdf.accessList.includes(userUid))) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }
        let drafts = await database.getPdfUserDrafts(pdfId, userUid);
        let submissions = await database.getPdfUserSubmissions(pdfId, userUid);
        res.json({ success: true, drafts, submissions });
    } catch (error) {
        console.error("Error connecting to database:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
        return;
    }
});

app.post("/api/pdfs/:pdfId/get-version", async (req, res) => {
    let pdfId = req.params.pdfId;
    let { userUid, versionId } = req.body;
    try {
        await database.connect();
        
        let pdf = await database.getPdfById(pdfId);
        if (!pdf) {
            res.status(404).json({ success: false, message: "PDF not found" });
            return;
        }
        if(!(pdf.accessList && pdf.accessList.includes(userUid))) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }
        let version = await database.getPdfVersionById(versionId, userUid);
        if(!version) {
            res.status(404).json({ success: false, message: "Version not found" });
            return;
        }
        res.json({ success: true, version });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.post("/api/pdfs/:pdfId/get-submission", async (req, res) => {
    let pdfId = req.params.pdfId;
    let { userUid, submissionId } = req.body;
    try {
        await database.connect();
        
        let pdf = await database.getPdfById(pdfId);
        if (!pdf) {
            res.status(404).json({ success: false, message: "PDF not found" });
            return;
        }
        if(!(pdf.createdBy === userUid)) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }
        let submission = await database.getPdfSubmissionById(submissionId);
        if(!submission) {
            res.status(404).json({ success: false, message: "Submission not found" });
            return;
        }
        res.json({ success: true, submission: submission });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.get("/api/user/:uid", async (req, res) => {
    let uid = req.params.uid;
    try {
        await database.connect();
        
        let userPdfs = await database.getUserPdfs(uid);
        if (userPdfs) {
            res.json({ success: true, user: { uid, pdfs: userPdfs } });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});