'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

const dbUrl = "postgres://postgres:postgres@localhost:4432/audius_creator_node"

const filename = '/Users/sid/Documents/Audius/code/audius/audius-protocol/creator-node/src/models/index.js'
const dirname = '/Users/sid/Documents/Audius/code/audius/audius-protocol/creator-node/src/models'

const basename = path.basename(filename)
const db = {}

const sequelize = new Sequelize(dbUrl, {
  logging: true,
  operatorsAliases: false,
  pool: {
    max: 100,
    min: 5,
    acquire: 60000,
    idle: 10000
  }
})

// read all files in models dir
fs.readdirSync(dirname)
  // filter out index.js, dotfiles, and non-js files
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
  })
  // import models from all files into db object
  .forEach(file => {
    const model = sequelize['import'](path.join(dirname, file))
    db[model.name] = model
  })

// build all associations specified in model files
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

// lol
db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
