import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnlockLinkDto {
  @ApiProperty({ example: 'senha123', description: 'Password for protected link' })
  @IsString()
  password: string;
}
