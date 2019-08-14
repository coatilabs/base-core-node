import {
  Table,
  Column,
  HasOne,
  DataType,
  BeforeBulkCreate,
  BeforeCreate,
  AfterCreate,
  BeforeUpdate,
  BeforeBulkUpdate,
  BeforeDestroy,
  Model,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Profile } from './Profile';
import * as bcrypt from 'bcrypt';

@Table
export class User extends Model<User> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isLength: {
        min: 8,
      },
    },
  })
  password: string;

  @Column({
    type: DataType.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user',
  })
  role: 'user' | 'admin';

  @HasOne(() => Profile, {
    hooks: true,
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @CreatedAt
  created_at: Date;
 
  @UpdatedAt
  updated_at: Date;

  @BeforeBulkCreate
  @BeforeBulkUpdate
  static activateIndividualHooks(items: User[], options: any) {
    options.individualHooks = true;
  }

  @BeforeCreate
  static async addPassword(user: User, options: any) {
    return await user.updatePassword();
  }

  @AfterCreate
  static async createProfile(user: User, options: any) {
    await user.addProfile();
  }

  @BeforeUpdate
  static async changePassword(user: User, options: any) {
    if (user.changed('password')) {
      return await user.updatePassword();
    }
    return;
  }

  @BeforeDestroy
  static async deleteChilds(user: User, options: any) {
    return Promise.all([Profile.destroy({ where: { user_id: user.id } })]);
  }

  toJSON() {

    const instance: any = super.toJSON();

    delete instance.created_at;
    delete instance.updated_at;
    delete instance.password;

    return instance;
  }

  async authenticate(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }

  async hashPassword(password: string): Promise<string> {
    if (password == null || password.length < 8)
      throw new Error('Invalid password');
    return await bcrypt.hash(password, 10);
  }

  async updatePassword() {
    const result = await this.hashPassword(this.password);
    this.password = result;
  }

  async addProfile(): Promise<Profile> {
    const profile = await Profile.create({
      time_zone: 'America/Mexico_City',
      user_id: this.id,
      locale: 'es', // Defaults, this should be changed in auth controller on register.
    });

    return profile;
  }
}
