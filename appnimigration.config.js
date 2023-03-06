const {DBManager} = require('./dbManager');
const config = require('../config.json');

const db = new DBManager(config.database);
module.exports = {
  query: async (query, bind) => {
    const res = await db.query(query, bind);
    return res.recordset;
  },
}