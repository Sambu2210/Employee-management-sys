import express, { json } from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { decode } from "punycode";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
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
    return res.json({ Status: "Success", Result: data });
  });
});

// Read the Table values

app.get("/read/:id", (req, res) => {
  const sql = "SELECT * FROM employee WHERE id = ?";
  const id = req.params.id;
  db.query(sql, [id], (err, data) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: data });
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
  const sql = "DELETE FROM employee WHERE id = ?";
  db.query(sql, [id], (err, data) => {
    if (err) return res.json("sql error");
    return res.json(data);
  });
});

app.get("/admincount", (req, res) => {
  const sql = "Select count(id) as admin from login";
  db.query(sql, (err, data) => {
    if (err) return res.json({ Error: "error in runnign sql query" });
    return res.json(data);
  });
});

app.get("/employeeCount", (req, res) => {
  const sql = "Select count(id) as employee from employee";
  db.query(sql, (err, data) => {
    if (err) return res.json({ Error: "error in runnign sql query" });
    return res.json(data);
  });
});

app.get("/salary", (req, res) => {
  const sql = "Select sum(salary) as sumOfSalary from employee";
  db.query(sql, (err, data) => {
    if (err) return res.json({ Error: "error in runnign sql query" });
    return res.json(data);
  });
});

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "You are not authendicated" });
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if (err) return res.json({ Error: "Error Token" });
      req.role = decoded.role;
      req.id = decoded.id;
      next();
    });
  }
};

app.get("/dashboard", verifyUser, (req, res) => {
  return res.json({ Status: "Success", role: req.role, id: req.id });
});

app.post("/login", (req, res) => {
  const values = [req.body.email, req.body.password];
  const sql = "SELECT * FROM login Where email = ? AND password = ?";

  db.query(sql, values, (err, data) => {
    if (err)
      return res.json({ status: "error", Error: "error in runnign query" });
    if (data.length > 0) {
      const id = data[0].id;
      const token = jwt.sign({ role: "admin" }, "jwt-secret-key", {
        expiresIn: "1d",
      });
      res.cookie("token", token);
      return res.json({ Status: "Success" });
    } else {
      return res.json({ status: "error", Error: "worng email or password" });
    }
  });
});

app.post("/employeelogin", (req, res) => {
  const sql = "SELECT * FROM employee Where email = ?";

  db.query(sql, [req.body.email], (err, data) => {
    if (err)
      return res.json({ Status: "error", Error: "error in runnign query" });
    if (data.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        data[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "password error" });
          const token = jwt.sign(
            { role: "employee", id: data[0].id },
            "jwt-secret-key",
            {
              expiresIn: "1d",
            }
          );
          res.cookie("token", token);
          return res.json({ Status: "Success", id: data[0].id });
        }
      );
    } else {
      return res.json({ status: "error", Error: "worng email or password" });
    }
  });
});

app.get("/employee/:id", (req, res) => {
  const sql = "SELECT * FROM employee WHERE `id`=?";
  const id = req.params.id;
  db.query(sql, [id], (err, data) => {
    if (err) return res.json("error");
    return res.json(data);
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});

app.listen(8081, () => {
  console.log("running");
});
