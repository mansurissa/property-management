require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              require: true,
              rejectUnauthorized: false
            }
          : false
    },
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + '_test',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              require: true,
              rejectUnauthorized: false
            }
          : false
    },
    logging: false
  },
  production: process.env.DATABASE_URL
    ? {
        // Use DATABASE_URL (Heroku) when available
        use_env_variable: 'DATABASE_URL',
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: false,
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000
        }
      }
    : {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: false,
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000
        }
      }
};
