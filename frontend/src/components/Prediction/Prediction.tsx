import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { createPrediction } from '../../Services/PredictionService'
import type { PredictionModel } from '../../Models/PredictionModel'
import './Prediction.css'

const ACCEPTED_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'avif']
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function Prediction() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<PredictionModel | null>(null)
    const [error, setError] = useState('')
    const objectUrlRef = useRef<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current)
            }
        }
    }, [])

    const resetFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const clearAllSelectionState = () => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current)
            objectUrlRef.current = null
        }

        setSelectedFile(null)
        setPreviewUrl(null)
        setResult(null)
        setError('')
        resetFileInput()
    }

    const clearPreviousResult = () => {
        setResult(null)
        setError('')
    }

    const validateFile = (file: File): string | null => {
        const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
        const isAllowedExtension = ACCEPTED_TYPES.includes(extension)
        const isAllowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type.toLowerCase())

        if (!isAllowedExtension || !isAllowedMime) {
            return 'Unsupported image type. Allowed: jpg, jpeg, png, webp, avif.'
        }

        if (file.size > MAX_FILE_SIZE) {
            return 'File too large. Maximum size is 10 MB.'
        }

        return null
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null

        clearPreviousResult()

        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current)
            objectUrlRef.current = null
        }

        if (!file) {
            setSelectedFile(null)
            setPreviewUrl(null)
            return
        }

        const validationError = validateFile(file)
        if (validationError) {
            setSelectedFile(null)
            setPreviewUrl(null)
            setError(validationError)
            event.target.value = ''
            return
        }

        setSelectedFile(file)
        setError('')

        const nextUrl = URL.createObjectURL(file)
        objectUrlRef.current = nextUrl
        setPreviewUrl(nextUrl)
    }

    const handleRemoveImage = () => {
        clearAllSelectionState()
    }

    const handleRestart = () => {
        clearAllSelectionState()
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()

        if (!selectedFile || loading) {
            return
        }

        setLoading(true)
        setError('')
        setResult(null)

        try {
            const prediction = await createPrediction(selectedFile)
            setResult(prediction)
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Prediction failed. Please try again.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="prediction-card">
            <form className="prediction-form" onSubmit={handleSubmit}>
                <div className="field-group">
                    <label htmlFor="image-upload" className="label">
                        Select a chess piece image
                    </label>

                    <div className="upload-row">
                        <input
                            ref={fileInputRef}
                            id="image-upload"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
                            onChange={handleFileChange}
                        />

                        {selectedFile && !loading && !result && (
                            <button type="button" className="secondary-button" onClick={handleRemoveImage}>
                                Remove
                            </button>
                        )}
                    </div>
                </div>

                {error && <p className="error-message">{error}</p>}

                {previewUrl && (
                    <div className="preview-box">
                        <img src={previewUrl} alt="Selected chess piece preview" className="preview-image" />
                    </div>
                )}

                {!result && (
                    <button type="submit" className="primary-button" disabled={!selectedFile || loading}>
                        {loading ? 'Predicting...' : 'Predict'}
                    </button>
                )}

                {result && !loading && (
                    <button type="button" className="primary-button restart-button" onClick={handleRestart}>
                        Restart
                    </button>
                )}
            </form>

            {result && (
                <div className="result-box" aria-live="polite">
                    <h2>{result.prediction}</h2>
                    <p>{(result.confidence * 100).toFixed(2)}% confidence</p>
                </div>
            )}
        </section>
    )
}
