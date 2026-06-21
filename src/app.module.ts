import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { LinksModule } from './links/links.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'general',
        limit: 60,
        ttl: 60,
      },
      {
        name: 'create',
        limit: 10,
        ttl: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    HealthModule,
    LinksModule,
  ],
})
export class AppModule {}
