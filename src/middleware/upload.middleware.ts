import multer from "multer";

export const upload = multer({
    dest: "uploads/",

    fileFilter: (req, file, callback) => {
        if (file.mimetype === "application/zip") {
            callback(null, true);
        } else {
            callback(new Error("Only ZIP files are allowed"));
        }
    }
});