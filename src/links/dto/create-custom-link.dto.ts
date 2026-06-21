import { IsUrl, IsOptional, IsString, IsDateString, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomLinkDto {
  @ApiProperty({ example: 'https://example.com/page', description: 'Original URL to shorten' })
  @IsUrl({ require_protocol: true })
  url: string;

  @ApiProperty({ example: 'custom-code', description: 'Custom code for the shortened link' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'code must contain only letters, numbers, hyphens or underscores',
  })
  code: string;

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
