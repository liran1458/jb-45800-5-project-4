import {
    AllowNull,
    Column,
    CreatedAt,
    DataType,
    Model,
    PrimaryKey,
    Table,
    Unique,
    UpdatedAt,
} from 'sequelize-typescript'

@Table({
    tableName: 'predictions',
    timestamps: true,
})
export default class Prediction extends Model {
    @PrimaryKey
    @AllowNull(false)
    @Column({
        type: DataType.UUID,
        field: 'id',
    })
    id!: string

    @AllowNull(false)
    @Column({
        type: DataType.STRING,
        field: 'original_file_name',
    })
    originalFileName!: string

    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING,
        field: 'image_key',
    })
    imageKey!: string

    @AllowNull(false)
    @Column({
        type: DataType.ENUM('pending', 'processing', 'completed', 'failed'),
        field: 'status',
        defaultValue: 'pending',
    })
    status!: 'pending' | 'processing' | 'completed' | 'failed'

    @Column({
        type: DataType.STRING,
        field: 'prediction',
        allowNull: true,
    })
    prediction!: string | null

    @Column({
        type: DataType.FLOAT,
        field: 'confidence',
        allowNull: true,
    })
    confidence!: number | null

    @Column({
        type: DataType.TEXT,
        field: 'error_message',
        allowNull: true,
    })
    errorMessage!: string | null

    @CreatedAt
    @Column({ field: 'created_at' })
    createdAt!: Date

    @UpdatedAt
    @Column({ field: 'updated_at' })
    updatedAt!: Date
}
