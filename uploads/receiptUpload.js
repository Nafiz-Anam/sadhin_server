const multer = require("multer");
const path = require("path");

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/receipts");
    },

    filename: (req, file, cb) => {
        let filename =
            file.fieldname +
            "-" +
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);
        if (req.all_files) {
            req.all_files[file.fieldname] = filename;
        } else {
            req.all_files = {};
            req.all_files[file.fieldname] = filename;
        }
        cb(null, filename);
    },
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        // check file type to be png, jpeg, or jpg
        cb(null, true);
    } else {
        cb(null, false); // else fails
    }
};

let receiptUpload = multer({
    storage: fileStorage,
    limits: { fileSize: "2mb" },
    fileFilter: fileFilter,
}).fields([
    {
        name: "receipt_img",
        maxCount: 1,
    },
]);

module.exports = receiptUpload;
