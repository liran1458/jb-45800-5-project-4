import { Sequelize } from "sequelize-typescript";
import config from 'config'

const sequelize = new Sequelize({
    dialect: 'mysql',
    models: [], // <= add all sequelize models here
    logging: console.log,
    ...config.get('db')
})

console.log(`connected to database on `, config.get('db'))

export default sequelize