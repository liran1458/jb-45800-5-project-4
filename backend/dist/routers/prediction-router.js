"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prediction_controller_1 = __importDefault(require("../controllers/prediction-controller"));
const file_uploader_1 = __importDefault(require("../middlewares/file-uploader"));
const file_validation_1 = __importDefault(require("../middlewares/file-validation"));
const router = (0, express_1.Router)();
router.post('/', file_uploader_1.default.single('image'), file_validation_1.default, prediction_controller_1.default);
exports.default = router;
