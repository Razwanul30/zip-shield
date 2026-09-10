import express from "express";
import multer from "multer";

const app = express();

const PORT = 3000;

const upload = multer({
    dest: "uploads/",
    fileFilter: (req, file, callback) => {
        if (file.mimetype === "application/zip") {
            callback(null, true);
        } else {
            callback(new Error("Only ZIP files are allowed"));
        }
    }
});

app.get("/", (req, res) => {
    res.json({
        message: "ZipShield is running"
    });
});

app.post("/upload", upload.single("file"), (req, res) => {
    res.json({
        message: "ZIP uploaded successfully",
        file: req.file
    });
});

app.listen(PORT, () => {
    console.log(`ZipShield running on http://localhost:${PORT}`);
});