import axios from 'axios'
import type { PredictionModel } from '../Models/PredictionModel'

const API_URL = import.meta.env.VITE_REST_SERVER_URL ?? 'http://localhost:3000'

export async function createPrediction(image: File): Promise<PredictionModel> {
    const formData = new FormData()
    formData.append('image', image)

    const response = await axios.post<PredictionModel>(`${API_URL}/api/predictions`, formData)

    return response.data
}
