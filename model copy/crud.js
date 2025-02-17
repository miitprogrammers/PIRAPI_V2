const database = require("../config/database");

class Crud {
  constructor() {
    this.selectArr = [];
    this.whereArr = [];
    this.joinArr = [];
    this.groupBy = "";
    this.query = ``;
    this.order = {
      field: "",
      order: "ASC",
    };
  }

  select(str) {
    this.selectArr.push(str);
  }
  where(key, value) {
    this.whereArr.push({key: key, value: value});
  }
  join(type, table, a, b) {
    this.joinArr.push({table: table, type: type, a: a, b: b});
  }
  get(table) {
    return new Promise((resolve, reject) => {
      this.query = `SELECT ${this.selectArr} from ${table}`;
      let wherequery = ``;
      let joinQuery = ``;
      if (this.joinArr.length > 0) {
        this.joinArr.forEach((element, index) => {
          if (element.type.toLowerCase() == "left") {
            joinQuery += ` LEFT JOIN ${element.table} ON ${element.a} = ${element.b}`;
          } else {
            joinQuery += ` RIGHT JOIN ${element.table} ON ${element.a} = ${element.b}`;
          }
        });
      }
      this.query += joinQuery;
      if (this.whereArr.length > 0) {
        this.whereArr.forEach((element, index) => {
          if (index === 0) {
            wherequery += ` WHERE ${element.key}  '${element.value}'`;
          } else {
            wherequery += ` AND ${element.key}  '${element.value}'`;
          }
        });
      }
      this.query += wherequery += ` ORDER BY ? ?`;
      database.query(
        this.query,
        [this.order.field, this.order.order],
        (err, res) => {
          if (err) {
            reject(err);
          }
          resolve(res);
        }
      );
    });
  }

  insert(table, data) {
    return new Promise((resolve, reject) => {
      const query = "INSERT INTO ?? SET ?";
      const values = [table, data];
      database.query(query, values, (err, result) => {
        if (err) {
          console.log("Error: ", err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  orderBy(field, order) {
    this.order.field = field;
    this.order.order = order;
  }

  update(table, data) {
    return new Promise((resolve, reject) => {
      this.query = `UPDATE ${table} SET ?`;
      let wherequery = ``;
      this.whereArr.forEach((element, index) => {
        if (index === 0) {
          wherequery += ` WHERE ${element.key}  ${element.value}`;
        } else {
          wherequery += ` AND ${element.key}  ${element.value}`;
        }
      });
      this.query += wherequery;
      database.query(this.query, [data], (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });
  }

  delete(table) {
    return new Promise((resolve, reject) => {
      this.query = `DELETE FROM ${table}`;
      let wherequery = ``;
      this.whereArr.forEach((element, index) => {
        if (index === 0) {
          wherequery += ` WHERE ${element.key}'${element.value}'`;
        } else {
          wherequery += ` AND ${element.key}'${element.value}'`;
        }
      });
      this.query += wherequery;
      database.query(this.query, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });
  }

  alter(table) {
    return new Promise((resolve, reject) => {
      database.query(`ALTER TABLE ${table} AUTO_INCREMENT=1`, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });
  }

  viewQuery() {
    return this.query;
  }
}

function isNull(str) {
  if (str == null) return null;
  return str;
}

module.exports = Crud;
