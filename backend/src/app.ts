import express, { json } from 'express'
import logError from './middlewares/error/log-error'
import config from 'config'
import respondError from './middlewares/error/error-responder'
import notFound from './middlewares/not-found'
import cors from 'cors'
import sequelize from './db/sequelize'
import predictionRouter from './routers/prediction-router'


(async () => {
    const port = config.get<number>('app.port')
    const name = config.get<string>('app.name')

    const app = express()

    app.use(cors())
    app.use(json())

    app.use('/api/predictions', predictionRouter)

    app.use('/', notFound)

    app.use('/', logError)
    app.use('/', respondError)

    await sequelize.sync({ force: !!config.get('app.sync.force') })

    app.listen(port, () => console.log(`app ${name} started on port ${port}....`))
})()
