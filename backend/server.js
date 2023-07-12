import express, { json } from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET", "PUT"],
    Credential: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));

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

app.get("/getemployee", (req, res) => {
  const sql = "SELECT * FROM employee";
  db.query(sql, (err, data) => {
    if (err) return res.json({ Error: "getemployee error in sql table" });
    return res.json({ status: "success", Result: data });
  });
});

// Read the Table values

app.get("/read/:id", (req, res) => {
  const sql = "SELECT * FROM employee WHERE `id`=?";
  const id = req.params.id;
  db.query(sql, [id], (err, data) => {
    if (err) return res.json("error");
    return res.json(data);
  });
});

// Edit the table values

app.put("/edit/:id", (req, res) => {
  const sql =
    "UPDATE `employee` SET `name`=? ,`email`=? ,`salary`=? ,`address`=? WHERE `employee`.`id`=?";

  const id = req.params.id;
  db.query(
    sql,
    [req.body.name, req.body.email, req.body.salary, req.body.address, id],
    (err, data) => {
      if (err) return res.json("SQL error");
      return res.json(data);
    }
  );
});

app.post("/create", upload.single("image"), (req, res) => {
  const sql =
    "INSERT INTO employee (`name`,`email`,`password`,`salary`,`address`,`image`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    if (err) return res.json({ Error: "Error in hashing password" });
    const values = [
      req.body.name,
      req.body.email,
      hash,
      req.body.salary,
      req.body.address,
      req.file.filename,
    ];
    db.query(sql, [values], (err, data) => {
      if (err) return res.json({ Error: "insert signuup error" });
      return res.json({ Status: "success" });
    });
  });
});

app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM `employee` WHERE `id` = ?";
  db.query(sql, [id], (err, data) => {
    if (err) return res.json("sql error");
    return res.json(data);
  });
});

const verifyUser = (req, res, next) => {
  const token = req.cookie.token;
  if (!token) {
    return res.json({ Error: "You are not authendicated" });
  } else {
    jwt.verify(token, "jwt-secreat-key", (err, decode) => {
      if (err) return res.json({ Error: "Error Token" });
      next();
    });
  }
};

app.get("/dashboard", verifyUser, (req, res) => {
  return res.json({ Status: "Success" });
});

app.post("/login", (req, res) => {
  const values = [req.body.email, req.body.password];
  const sql = "SELECT * FROM login Where email = ? AND password = ?";

  db.query(sql, values, (err, data) => {
    if (err)
      return res.json({ status: "error", Error: "error in runnign query" });
    if (data.length > 0) {
      //   const id = data[0].id;
      //   const token = jwt.sign({ id }, "jwt-secret-key", { expiresIn: "id" });
      //   res.cookie("token", token);
      return res.json({ Status: "Success" });
    } else {
      return res.json({ status: "error", Error: "worng email or password" });
    }
  });
});

app.listen(8081, () => {
  console.log("running");
});
