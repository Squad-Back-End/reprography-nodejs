'use strict';

const config = require("../.config/db.config.json");

const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect
  });

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || 'development';
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// db.user = require("../models/usuario")(sequelize, Sequelize);
// db.role = require("../models/tipo_usuario")(sequelize, Sequelize);

// db.role.belongsToMany(db.user, {
//   through: "user_roles",
//   foreignKey: "roleId",
//   otherKey: "userId"
// });
// db.user.belongsToMany(db.role, {
//   through: "user_roles",
//   foreignKey: "userId",
//   otherKey: "roleId"
// });

db.ROLES = ["user", "moderator", "admin"]

module.exports = db;