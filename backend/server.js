import express, { json } from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "signup",
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});
db.connect(function (err) {
  if (err) {
    console.log("error in connection");
  } else {
    console.log("connection");
  }
});

app.post("/login", (req, res) => {
  const values = [req.body.email, req.body.password];
  const sql = "SELECT * FROM login Where email = ? AND password = ?";

  db.query(sql, values, (err, data) => {
    if (err)
      return res.json({ status: "error", Error: "error in runnign query" });
    if (data.length > 0) {
      return res.json({ Status: "Success" });
    } else {
      return res.json({ status: "error", Error: "worng email or password" });
    }
  });
});

app.post("/create", upload.single("image"), (req, res) => {
  const sql =
    "INSERT INTO employee (`name`,`email`,`password`,`address`,`image`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    if (err) return res.json({ Error: "Error in hashing password" });
    const values = [
      req.body.name,
      req.body.email,
      hash,
      req.body.address,
      req.file.filename,
    ];
    db.query(sql, [values], (err, data) => {
      if (err) return res.json({ Error: "insert signuup error" });
      return res.json({ Status: "success" });
    });
  });
});

app.listen(8081, () => {
  console.log("running");
});
