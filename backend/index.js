let express = require("express");
let app = express();
let multer = require("multer");
let cors = require("cors");

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

app.post("/api/upload", upload.single("file"), (req, res) => {
    let name = req.body.name;
    let description = req.body.description;
    let accessList = JSON.parse(req.body.accessList || "[]");
    let file = req.file;
    console.log("Received upload:", { name, description, accessList, file });
    res.json({ success: true, message: "File uploaded successfully" });
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});