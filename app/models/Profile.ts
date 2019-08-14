import {
  Table,
  Column,
  DataType,
  BelongsTo,
  ForeignKey,
  Model,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { User } from './User';

@Table
export class Profile extends Model<Profile> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  time_zone: string;

  @Column({
    type: DataType.ENUM('en', 'es'),
    allowNull: true,
  })
  locale: 'en' | 'es' | string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  payment_key: string;

  @ForeignKey(() => User)
  @Column
  user_id: number;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  created_at: Date;
 
  @UpdatedAt
  updated_at: Date;

  toJSON() {

    const instance: any = super.toJSON();

    delete instance.created_at;
    delete instance.updated_at;
    delete instance.id;

    return instance;
  }
  
  static LOCALES = ['es', 'en'];
}
