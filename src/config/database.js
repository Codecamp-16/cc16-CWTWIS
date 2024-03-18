const Sequelize = require("sequelize");
// const config = require("config");
// const dbConfig = config.get("database");

const sequelize = new Sequelize("my-db", "auth-service", "p4ssword", {
  dialect: "sqlite",
  storage: "./db.sqlite",
  logging: true,
});

module.exports = sequelize;
