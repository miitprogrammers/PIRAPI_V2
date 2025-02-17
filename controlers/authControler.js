const crypter = require("../helpers/crypter");
const Crud = require("../model/crud.js");

const auth = {
  login: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);

      const userName = obj.userName;
      const password = obj.password;
      db.select("*");
      db.join("left", "t_role", "t_role.roleId", "role");
      db.where("userName=", userName);
      db.where("t_user.active=", 1);
      const useData = await db.get("t_user");
      if (useData.length < 1) {
        return res.status(404).json({error: "User not found"});
      }

      const hashedPassword = useData[0].password;
      const dbPassword = crypter.decryptText(hashedPassword);
      if (password !== dbPassword) {
        return res.status(404).json({error: "Wrong password"});
      }

      const token = crypter.encryptText(useData[0].userId.toString());
      return res.status(200).json({token, useData});
    } catch (error) {
      return res.status(400).json(error);
    }
  },
  reqaccess: async (req, res) => {
    try {
      const db = new Crud();
      const db2 = new Crud();
      const db3 = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const akunId = crypter.decryptObject(obj.token);

      db.select("role");
      db.join("left", "t_role", "roleId", "role");
      db.where("userId=", akunId);
      const response = await db.get("t_user");
      const role = response[0].role;

      db2.select("*");
      db2.where("path=", obj.path);
      const menus = await db2.get("t_menus");

      db3.select("*");
      db3.where("path=", obj.path);
      const settings = await db3.get("t_setting");

      if (settings.length < 1 && menus.length < 1) {
        return res.status(200).json({});
      } else {
        if (menus.length > 0) {
          const access = JSON.parse(menus[0].access);
          if (!access.includes(role)) {
            return res
              .status(400)
              .json({error: "You dont have permission to access this page."});
          } else {
            return res.status(200).json({});
          }
        }

        if (settings.length > 0) {
          const access = JSON.parse(settings[0].access);
          if (!access.includes(role)) {
            return res
              .status(400)
              .json({error: "You dont have permission to access this page."});
          } else {
            return res.status(200).json({});
          }
        }
      }
    } catch (error) {
      return res.status(400).json(error);
    }
  },
  getsetting: async (req, res) => {
    try {
      const db = new Crud();
      const db2 = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const akunId = crypter.decryptObject(obj.token);
      db.select("role");
      db.join("left", "t_role", "roleId", "role");
      db.where("userId=", akunId);
      const response = await db.get("t_user");
      const role = response[0].role;

      db2.select("*");
      let settings = await db2.get("t_setting");

      //e.access berisi array role
      settings = settings.filter((e) => JSON.parse(e.access).includes(role));

      return res.status(200).json({settings});
    } catch (error) {
      return res.status(400).json({error});
    }
  },
  getmenu: async (req, res) => {
    try {
      const db = new Crud();
      const db2 = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const akunId = crypter.decryptObject(obj.token);
      db.select("role");
      db.join("left", "t_role", "roleId", "role");
      db.where("userId=", akunId);
      const response = await db.get("t_user");
      const role = response[0].role;

      db2.select("*");
      let settings = await db2.get("t_menus");

      // //e.access berisi array role
      // settings = settings.filter((e) => JSON.parse(e.access).includes(role));

      return res.status(200).json({settings, role});
    } catch (error) {
      return res.status(400).json({error});
    }
  },
  getmenuadmin: async (req, res) => {
    try {
      const db2 = new Crud();

      db2.select("*");
      let settings = await db2.get("t_menus");

      return res.status(200).json({settings});
    } catch (error) {
      return res.status(400).json({error});
    }
  },
  updateaccess: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);

      db.where("id=", obj.menuId);
      await db.update("t_menus", {access: JSON.stringify(obj.access)});

      return res.status(200).json({obj});
    } catch (error) {
      return res.status(400).json({error});
    }
  },
  updatemenuview: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);

      db.where("id=", obj.menuId);
      await db.update("t_menus", {view: JSON.stringify(obj.view)});

      return res.status(200).json({obj});
    } catch (error) {
      return res.status(400).json({error});
    }
  },
  getakundata: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const akunId = crypter.decryptObject(obj.token);
      db.join("left", "t_role", "roleId", "role");
      db.select("*");
      db.where("userId=", akunId);
      const response = await db.get("t_user");

      return res.status(200).json({response: response[0]});
    } catch (error) {
      return res.status(400).json({error});
    }
  },
  createPassword: async (req, res) => {
    try {
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const pass = crypter.encryptText(obj.password);

      return res.status(200).json({pass});
    } catch (error) {
      return res.status(400).json(error);
    }
  },
};

const createPassword = (str) => {
  return crypter.encryptText(str);
};

module.exports = auth;
