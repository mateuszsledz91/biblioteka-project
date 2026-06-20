const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "dane wrażliwe",
  database: "biblioteka_db",
});

module.exports = pool;