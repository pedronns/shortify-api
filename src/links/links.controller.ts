import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { LinksService } from './links.service';
import { CreateRandomLinkDto } from './dto/create-random-link.dto';
import { CreateCustomLinkDto } from './dto/create-custom-link.dto';
import { UnlockLinkDto } from './dto/unlock-link.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';

@ApiTags('Links')
@ApiBearerAuth('JWT')
@Controller()
export class LinksController {
  constructor(private links: LinksService) {}

  // POST /random
  @Post('random')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ create: { limit: 10, ttl: 60 } })
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Create a random shortened link' })
  @ApiCreatedResponse({ description: 'Random link created successfully' })
  createRandom(
    @Body() dto: CreateRandomLinkDto,
    @CurrentUser() user: { id: string } | null,
  ) {
    return this.links.createRandom(dto, user?.id);
  }

  // POST /custom
  @Post('custom')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ create: { limit: 10, ttl: 60 } })
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Create a custom shortened link' })
  @ApiCreatedResponse({ description: 'Custom link created successfully' })
  createCustom(
    @Body() dto: CreateCustomLinkDto,
    @CurrentUser() user: { id: string } | null,
  ) {
    return this.links.createCustom(dto, user?.id);
  }

  // GET /info/:code
  @Get('info/:code')
  @ApiOperation({ summary: 'Get public information for a shortened link' })
  @ApiOkResponse({ description: 'Public link info returned' })
  @ApiParam({ name: 'code', description: 'Short link code' })
  getInfo(@Param('code') code: string) {
    return this.links.getInfo(code);
  }

  // GET /stats/:code — authenticated
  @Get('stats/:code')
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Get statistics for a shortened link' })
  @ApiOkResponse({ description: 'Link statistics returned' })
  @ApiParam({ name: 'code', description: 'Short link code' })
  getStats(
    @Param('code') code: string,
    @CurrentUser() user: { id: string } | null,
  ) {
    return this.links.getStats(code, user?.id);
  }

  // GET /me/links — authenticated, returns all links of logged user
  @Get('me/links')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all links created by the authenticated user' })
  @ApiOkResponse({ description: 'User links returned' })
  getMyLinks(@CurrentUser() user: { id: string }) {
    return this.links.getMyLinks(user.id);
  }

  // GET /:code
  @Get(':code')
  @ApiOperation({ summary: 'Resolve a shortened link to the original URL' })
  @ApiOkResponse({ description: 'Original URL returned if link is public' })
  @ApiParam({ name: 'code', description: 'Short link code' })
  access(@Param('code') code: string) {
    return this.links.access(code);
  }

  // POST /:code/unlock
  @Post(':code/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock a protected shortened link with a password' })
  @ApiOkResponse({ description: 'Protected link unlocked and original URL returned' })
  @ApiParam({ name: 'code', description: 'Short link code' })
  unlock(@Param('code') code: string, @Body() dto: UnlockLinkDto) {
    return this.links.unlock(code, dto);
  }

  // DELETE /:code
  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Delete a shortened link' })
  @ApiNoContentResponse({ description: 'Link deleted successfully' })
  @ApiParam({ name: 'code', description: 'Short link code' })
  delete(
    @Param('code') code: string,
    @CurrentUser() user: { id: string } | null,
  ) {
    return this.links.delete(code, user?.id);
  }
}
