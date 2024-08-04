const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const path = require("path");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/pdfdocs";
const conn = mongoose.createConnection(mongoURI);

let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => ({
    bucketName: "uploads",
    filename: file.originalname,
  }),
});
const upload = multer({ storage });

// Middleware to authenticate Firebase token
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized", error });
  }
};

app.post("/upload", authenticate, upload.single("file"), (req, res) => {
  res.status(201).json(req.file);
});

app.get("/files", authenticate, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const files = await gfs.files.find().skip(skip).limit(limit).toArray();
    const totalFiles = await gfs.files.countDocuments();
    res.json({ files, totalFiles, totalPages: Math.ceil(totalFiles / limit) });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

app.get("/files/:id", authenticate, async (req, res) => {
  try {
    const file = await gfs.files.findOne({
      _id: mongoose.Types.ObjectId(req.params.id),
    });
    if (!file) return res.status(404).json({ message: "No file found" });

    const readstream = gfs.createReadStream(file.filename);
    readstream.on("error", (error) =>
      res.status(500).json({ message: "Error reading file", error })
    );
    readstream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

app.listen(5000, () => console.log("Server started on port 5000"));
