import express from "express";
import multer from "multer";

const app = express();

const upload = multer({
    dest: "uploads/"
});

app.get("/", (req, res) => {
    res.json({
        message: "ZipShield is running"
    });
});

app.post("/upload", upload.single("file"), (req, res) => {
    res.json({
        message: "File uploaded successfully",
        file: req.file
    });
});

app.listen(3000, () => {
    console.log("ZipShield running on http://localhost:3000");
});