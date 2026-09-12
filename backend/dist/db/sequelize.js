"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const config_1 = __importDefault(require("config"));
const prediction_model_1 = __importDefault(require("../models/prediction-model"));
const sequelize = new sequelize_typescript_1.Sequelize({
    dialect: 'mysql',
    models: [prediction_model_1.default],
    logging: console.log,
    ...config_1.default.get('db')
});
console.log(`connected to database on `, config_1.default.get('db'));
exports.default = sequelize;
