const crypter = require("../helpers/crypter");
const Crud = require("../model/crud.js");
const moment = require("moment");

module.exports = {
  searchPart: async (req, res) => {
    try {
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const partNumber = obj.partNumber;
      const part = await searchPart(partNumber);
      return res.status(200).json(part);
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  submitInspection: async (req, res) => {
    try {
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      const akunId = crypter.decryptObject(obj.token);
      let insertData = {
        partId: obj.partData.partId,
        deliveryDate: obj.headerData.deliveryDate,
        akunId,
        deliveryQty: obj.headerData.deliveryQuantity,
        inspectionDate: obj.headerData.inspectionDate,
        lotNumber: obj.headerData.lotNumber,
        sampleQty: obj.headerData.n,
        category: obj.headerData.category,
        inspectionData: JSON.stringify(obj.partData.inspectionItem),
        inspectorJudgement: obj.inspectorJudgement
      }
      const db = new Crud
      await db.insert('t_inspection', insertData)

      return res.status(200).json(insertData);
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  getInspection: async (req, res) => {
    try {
      const db = new Crud
      db.select('*')
      db.join('left', 't_user', 't_user.userId', 't_inspection.akunId')
      db.join('left', 't_part', 't_part.partId', 't_inspection.partId')
      db.where('managerJudgement=', 0)
      const result = await db.get('t_inspection')
      return res.status(200).json(result);
    } catch (error) {

      return res.status(404).json({ error });
    }
  },

  getInspectionFinish: async (req, res) => {
    try {
      const db = new Crud
      db.select('*')
      db.join('left', 't_part', 't_part.partId', 't_inspection.partId')
      db.join('left', 't_user', 't_user.userId', 't_inspection.akunId')
      db.orderBy('deliveryDate', 'DESC')
      db.where('managerJudgement=', 1)
      const result = await db.get('t_inspection')
      return res.status(200).json(result);
    } catch (error) {

      return res.status(404).json({ error });
    }
  },

  getSignData: async (req, res) => {
    try {
      const hash = req.body.hash;
      const obj = crypter.decryptObject(hash);
      return res.status(200).json(obj);
    } catch (error) {

      return res.status(404).json({ error });
    }
  },

  getInspectionNG: async (req, res) => {
    try {
      const db = new Crud
      db.select('*')
      db.join('left', 't_part', 't_part.partId', 't_inspection.partId')
      db.join('left', 't_user', 't_user.userId', 't_inspection.akunId')
      db.where('managerJudgement=', 2)
      const result = await db.get('t_inspection')
      return res.status(200).json(result);
    } catch (error) {

      return res.status(404).json({ error });
    }
  },
  getCategory: async (req, res) => {
    try {
      const db = new Crud
      db.select('*')
      const category = await db.get('pircategory');
      return res.status(200).json(category);
    } catch (error) {
      return res.status(404).json({ error });
    }
  },
  signInspection: async (req, res) => {
    try {
      const hash = req.body.hash;
      let obj = crypter.decryptObject(hash);
      obj.akunId = crypter.decryptObject(obj.token);
      let updateData = {}
      const db = new Crud
      db.where('inspectionId=', obj.inspectionId)
      updateData[obj.field] = obj.value
      updateData[obj.id] = obj.akunId
      updateData[obj.updateDate] = moment(new Date()).format('YYYY-MM-DD')

      if (obj.note != undefined) {
        updateData[obj.noteId] = obj.note
      }

      await db.update('t_inspection', updateData)

      return res.status(200).json(updateData);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }
};

function searchPart(partNumber) {
  return new Promise(async (resolve, reject) => {
    const db = new Crud();
    db.select("*");
    db.where("partNumber=", partNumber);
    db.where("active=", 1);
    const part = await db.get("t_part");
    if (part.length == 0) {
      reject("No part found");
    } else {
      resolve(part);
    }
  });
}
