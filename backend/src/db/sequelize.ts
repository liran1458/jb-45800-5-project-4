import { Sequelize } from "sequelize-typescript";
import config from 'config'
import Prediction from '../models/prediction-model'

const sequelize = new Sequelize({
    dialect: 'mysql',
    models: [Prediction],
    logging: console.log,
    ...config.get('db')
})

console.log(`connected to database on `, config.get('db'))

export default sequelize