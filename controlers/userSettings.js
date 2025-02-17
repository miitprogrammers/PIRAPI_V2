const crypter = require("../helpers/crypter");
const Crud = require("../model/crud.js");
const fs = require("fs/promises");
const path = require("path"); // Untuk membangun path file secara aman

const auth = {
  users: async (req, res) => {
    try {
      const db = new Crud();
      db.select("*");
      db.where("t_user.active=", 1);
      db.join("left", "t_role", "t_role.roleId", "t_user.role");
      const response = await db.get("t_user");
      return res.json(response);
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  newUser: async (req, res) => {
    try {
      const data = req.body;
      const db = new Crud();

      await checkUserName(data.userName);

      delete data.confirmPassword;
      const password = crypter.encryptText(data.password);
      data.password = password;

      await db.insert("t_user", data);
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
      const uploadedFile = req.files.signFile;
      uploadedFile.mv(
        "uploads/signs/" + uploadedFile.name + ".png",
        function (err) {
          if (err) {
            return res.status(500).send(err);
          }
          res.json({
            success: true,
            message: "File uploaded successfully!",
            fileName: uploadedFile.name,
          });
        }
      );
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  changeSign: async (req, res) => {
    try {
      const uploadedFile = req.files.signFile;
      uploadedFile.mv(
        "uploads/signs/" + uploadedFile.name + ".png",
        function (err) {
          if (err) {
            return res.status(500).send(err);
          }
          res.json({
            success: true,
            message: "File uploaded successfully!",
            fileName: uploadedFile.name,
          });
        }
      );
      // res.status(200).json(req.files);
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  newRole: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const checkname = await checkRoleName(obj.roleName);
      await db.insert("t_role", obj);
      return res.status(200).json(checkname);
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  deleteRole: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const roleId = obj.roleId;
      db.where("roleId=", roleId);
      await db.update("t_role", { active: 0 });
      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  editRole: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      await checkRoleName(obj.roleName, obj.roleId);
      db.where("roleId=", obj.roleId);
      await db.update("t_role", { roleName: obj.roleName, home: obj.home });
      return res.status(200).json(obj);
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  getroles: async (req, res) => {
    try {
      const db = new Crud();
      db.select("*");
      db.where("active=", 1);
      const response = await db.get("t_role");
      return res.status(200).json(response);
    } catch (error) {
      return res.status(404).json({ error });
    }
  },

  edituserdata: async (req, res) => {
    try {
      const dbCheck = new Crud();
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);

      // Ambil userName lama berdasarkan userId
      dbCheck.select("userName");
      dbCheck.where("userId=", obj.userId);
      const userData = await dbCheck.get("t_user");

      if (!userData || userData.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const oldUserName = userData[0].userName;

      // Periksa jika userName diubah
      if (oldUserName !== obj.userName) {
        await checkUserName(obj.userName); // Validasi userName baru

        // Path file lama dan baru
        const oldFilePath = path.join(
          __dirname,
          "../uploads/signs",
          `sign_${oldUserName}.png`
        );
        const newFilePath = path.join(
          __dirname,
          "../uploads/signs",
          `sign_${obj.userName}.png`
        );

        try {
          // Ganti nama file jika file lama ada
          await fs.rename(oldFilePath, newFilePath);
          console.log(`File renamed from ${oldFilePath} to ${newFilePath}`);
        } catch (err) {
          if (err.code === "ENOENT") {
            console.error("Old signature file not found, skipping rename.");
          } else {
            throw err; // Error lain dilempar untuk ditangani
          }
        }
      }

      // Update data user di database
      db.where("userId=", obj.userId);
      await db.update("t_user", obj);

      return res.status(200).json(userData);
    } catch (error) {
      console.error("Error in edituserdata:", error.message);
      return res.status(400).json({ error: error.message });
    }
  },

  getuserdata: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const akunId = obj.userId;

      db.join("left", "t_role", "roleId", "role");
      db.select("*");
      db.where("userId=", akunId);
      const response = await db.get("t_user");

      if (!response || response.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const signFilePath = `./uploads/signs/sign_${response[0].userName}.png`;

      // Coba baca file tanda tangan
      let signFileContent = null;
      try {
        const fileBuffer = await fs.readFile(signFilePath); // Baca file sebagai buffer
        signFileContent = fileBuffer.toString("base64"); // Ubah ke format base64
      } catch (fileError) {
        console.error("Error reading signature file:", fileError.message);
        // Tetapkan null jika file tidak ditemukan
        signFileContent = null;
      }

      // Kirim respons dengan file tanda tangan (jika ada)
      return res.status(200).json({
        response: response[0],
        signFile: signFileContent, // Isi file (dalam base64) atau null
      });
    } catch (error) {
      console.error("Error in getuserdata:", error.message);
      return res.status(400).json({ error: error.message });
    }
  },
  changePassAdminSide: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);

      const userId = obj.userId;
      const password = createPassword(obj.password);
      db.where("userId=", userId);
      await db.update("t_user", { password });

      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const userId = obj.userId;
      db.where("userId=", userId);
      await db.update("t_user", { active: 0 });
      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
};

const checkRoleName = (roleName, roleId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (roleId != undefined) {
        const dataBase = new Crud();
        dataBase.select("*");
        dataBase.where("roleName=", roleName);
        dataBase.where("roleId!=", roleId);
        dataBase.where("active=", 1);

        const res = await dataBase.get("t_role");
        if (res.length > 0) {
          reject("role name is already taken");
        } else {
          resolve(res);
        }
      } else {
        const dataBase = new Crud();
        dataBase.select("*");
        dataBase.where("roleName=", roleName);
        dataBase.where("active=", 1);

        const res = await dataBase.get("t_role");
        if (res.length > 0) {
          reject("role name is already taken");
        } else {
          resolve(res);
        }
      }

    } catch (error) {
      reject(error);
    }
  });
};

const checkUserName = (userName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dataBase = new Crud();
      dataBase.select("*");
      dataBase.where("userName=", userName);
      dataBase.where("active=", 1);

      const res = await dataBase.get("t_user");
      if (res.length > 0) {
        reject("user name is already taken");
      } else {
        resolve(res);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const createPassword = (str) => {
  return crypter.encryptText(str);
};

module.exports = auth;
