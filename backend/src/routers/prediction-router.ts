import { Router } from 'express'
import createPrediction from '../controllers/prediction-controller'
import upload from '../middlewares/file-uploader'
import validateImageUpload from '../middlewares/file-validation'

const router = Router()

router.post('/', upload.single('image'), validateImageUpload, createPrediction)

export default router
