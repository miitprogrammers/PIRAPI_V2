const crypter = require("../helpers/crypter");
const Crud = require("../model/crud.js");
const fs = require("fs/promises");
const path = require("path"); // Untuk membangun path file secara aman

module.exports = {
  newmethod: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      await checkMethod(obj.methodName);
      await db.insert("t_method", obj);
      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  updatemethod: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      await checkMethod(obj.methodName);
      db.where("id=", obj.id);
      await db.update("t_method", obj);
      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  getMethod: async (req, res) => {
    try {
      const db = new Crud();
      db.select("*");
      db.where("active=", 1);
      const methods = await db.get("t_method");

      return res.status(200).json({ methods });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  deletMethod: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      db.where("id=", obj.deleteId);
      await db.update("t_method", { active: 0 });
      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  getTools: async (req, res) => {
    try {
      const db = new Crud();
      db.select("*");
      db.join("left", "t_method", "t_tool.method", "t_method.id");
      db.where("t_tool.active=", 1);
      const tools = await db.get("t_tool");

      return res.status(200).json({ tools });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  addTool: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      await checkTool(obj.toolName);
      const response = await db.insert("t_tool", obj);
      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  editTool: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      await checkTool(obj.toolName, obj.toolId);
      db.where("toolId=", obj.toolId);
      await db.update("t_tool", obj);
      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  deleteTool: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      db.where("toolId=", obj.deleteId);
      await db.update("t_tool", { active: 0 });
      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  gettype: async (req, res) => {
    try {
      const db = new Crud();
      db.select("*");
      const types = await db.get("t_type");
      return res.status(200).json({ types });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  getrange: async (req, res) => {
    try {
      const db = new Crud();
      db.select("*");
      const range = await db.get("t_samplerange");
      return res.status(200).json({ range });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  changeRange: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      db.where("id=", obj.id);
      await db.update("t_samplerange", obj);
      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  addPir: async (req, res) => {
    try {
      const data = req.body;
      const db = new Crud();
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
      await checkPart(data.partNumber);
      const response = await db.insert("t_part", data);
      const uploadedFile = req.files.designFile;
      const filePath = `uploads/drawings/drawingPart_${response.insertId}.png`;
      uploadedFile.mv(filePath, function (err) {
        if (err) {
          return res.status(500).send(err);
        }
        return res.status(200).json({ response });
      });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  getPart: async (req, res) => {
    try {
      const db = new Crud();
      db.select("*");
      db.where("active=", 1);
      const parts = await db.get("t_part");
      return res.status(200).json(parts);
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  getDrawing: async (req, res) => {
    try {
      const db = new Crud();
      const db2 = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const partId = obj.partId;

      const drawingPath = `./uploads/drawings/drawingPart_${partId}.png`;

      let signFileContent = null;
      try {
        const fileBuffer = await fs.readFile(drawingPath); // Baca file sebagai buffer
        signFileContent = fileBuffer.toString("base64"); // Ubah ke format base64
      } catch (fileError) {
        console.error("Error reading signature file:", fileError.message);
        signFileContent = null;
      }

      db2.select("*");
      db2.where("partId=", partId);
      const partData = await db2.get("t_part");
      const data = {
        signFileContent,
        partData,
      };

      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  editPart: async (req, res) => {
    try {
      const data = req.body;
      const db = new Crud();
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
      await checkPartEdit(data.partNumber, data.partId);
      db.where("partId=", data.partId);
      const response = await db.update("t_part", data);
      const uploadedFile = req.files.designFile;
      const filePath = `uploads/drawings/drawingPart_${data.partId}.png`;
      uploadedFile.mv(filePath, function (err) {
        if (err) {
          return res.status(500).send(err);
        }
        return res.status(200).json({ response });
      });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  deletePart: async (req, res) => {
    try {
      const db = new Crud();
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      db.where("partId=", obj.partId);
      await db.update("t_part", { active: 0 });
      return res.status(200).json({ obj });
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  getHomes: async (req, res) => {
    try {
      const db = new Crud
      db.select('*')
      const path = await db.get('t_menus')

      return res.status(200).json(path);
    } catch (error) {

      return res.status(404).json({ error });
    }
  }
};

const checkMethod = (methodName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dataBase = new Crud();
      dataBase.select("*");
      dataBase.where("methodName=", methodName);
      dataBase.where("active=", 1);

      const res = await dataBase.get("t_method");
      if (res.length > 0) {
        reject("Method name is already taken");
      } else {
        resolve(res);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const checkPart = (partNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dataBase = new Crud();
      dataBase.select("*");
      dataBase.where("partNumber=", partNumber);
      dataBase.where("active=", 1);

      const res = await dataBase.get("t_part");
      if (res.length > 0) {
        reject("Part number is already taken");
      } else {
        resolve(res);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const checkPartEdit = (partNumber, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dataBase = new Crud();
      dataBase.select("*");
      dataBase.where("partId!=", id);
      dataBase.where("partNumber=", partNumber);
      dataBase.where("active=", 1);

      const res = await dataBase.get("t_part");
      if (res.length > 0) {
        reject(res);
      } else {
        resolve(res);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const checkTool = (toolName, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dataBase = new Crud();
      dataBase.select("*");
      dataBase.where("toolName=", toolName);
      dataBase.where("toolId!=", id);
      dataBase.where("active=", 1);

      const res = await dataBase.get("t_tool");
      if (res.length > 0) {
        reject("Tool name is already taken");
      } else {
        resolve(res);
      }
    } catch (error) {
      reject(error);
    }
  });
};
