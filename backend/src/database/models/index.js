'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Import all models
const User = require('./user')(sequelize, DataTypes);
const Property = require('./property')(sequelize, DataTypes);
const Unit = require('./unit')(sequelize, DataTypes);
const Tenant = require('./tenant')(sequelize, DataTypes);
const Payment = require('./payment')(sequelize, DataTypes);
const MaintenanceTicket = require('./maintenanceTicket')(sequelize, DataTypes);
const ReminderLog = require('./reminderLog')(sequelize, DataTypes);
const PropertyManager = require('./propertymanager')(sequelize, DataTypes);
const AgentApplication = require('./agentApplication')(sequelize, DataTypes);
const CommissionRule = require('./commissionRule')(sequelize, DataTypes);
const AgentTransaction = require('./agentTransaction')(sequelize, DataTypes);
const AgentCommission = require('./agentCommission')(sequelize, DataTypes);

// Add models to db object
db.User = User;
db.Property = Property;
db.Unit = Unit;
db.Tenant = Tenant;
db.Payment = Payment;
db.MaintenanceTicket = MaintenanceTicket;
db.ReminderLog = ReminderLog;
db.PropertyManager = PropertyManager;
db.AgentApplication = AgentApplication;
db.CommissionRule = CommissionRule;
db.AgentTransaction = AgentTransaction;
db.AgentCommission = AgentCommission;

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Export sequelize for TypeScript compatibility
module.exports = db;
module.exports.sequelize = sequelize;
module.exports.User = User;
module.exports.Property = Property;
module.exports.Unit = Unit;
module.exports.Tenant = Tenant;
module.exports.Payment = Payment;
module.exports.MaintenanceTicket = MaintenanceTicket;
module.exports.ReminderLog = ReminderLog;
module.exports.PropertyManager = PropertyManager;
module.exports.AgentApplication = AgentApplication;
module.exports.CommissionRule = CommissionRule;
module.exports.AgentTransaction = AgentTransaction;
module.exports.AgentCommission = AgentCommission;
