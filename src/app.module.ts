import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { CounsellorModule } from './counsellor/counsellor.module';
import { SlotsModule } from './slots/slots.module';
import { StudentModule } from './student/student.module';

@Module({
  imports: [
    // Load environment variables from .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database connection
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // Automatically creates tables (turn off in production)
      ssl: {
        rejectUnauthorized: false, // Needed for Neon
      },
      entitySkipConstructor: true,
    }),

    // Your modules
    AdminModule,
    CounsellorModule,
    SlotsModule,
    StudentModule
  ],
})
export class AppModule {}
