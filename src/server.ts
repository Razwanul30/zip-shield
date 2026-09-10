import express from "express";
import uploadRouter from "./routes/upload.route";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
    res.json({
        message: "ZipShield is running"
    });
});

app.use("/upload", uploadRouter);

app.listen(PORT, () => {
    console.log(`ZipShield running on http://localhost:${PORT}`);
});