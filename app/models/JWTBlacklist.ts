import {
  Table,
  Model,
  Column,
  DataType,
  BelongsTo,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';

@Table
export class JWTBlacklist extends Model<JWTBlacklist> {
  @Column({
    type: DataType.STRING(512),
    allowNull: false,
  })
  token: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  expires: Date;

  @CreatedAt
  created_at: Date;
 
  @UpdatedAt
  updated_at: Date;
}
