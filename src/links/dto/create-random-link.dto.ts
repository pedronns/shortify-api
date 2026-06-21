import { IsUrl, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRandomLinkDto {
  @ApiProperty({ example: 'https://example.com/page', description: 'Original URL to shorten' })
  @IsUrl({ require_protocol: true })
  url: string;

  @ApiPropertyOptional({ example: 'senha123', description: 'Optional password to protect the link' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Optional expiration timestamp in ISO 8601 format',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
