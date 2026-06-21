import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LinksRepository } from './links.repository';
import { CreateRandomLinkDto } from './dto/create-random-link.dto';
import { CreateCustomLinkDto } from './dto/create-custom-link.dto';
import { UnlockLinkDto } from './dto/unlock-link.dto';

@Injectable()
export class LinksService {
  constructor(private repo: LinksRepository) {}

  async createRandom(dto: CreateRandomLinkDto, userId?: string) {
    this.validateNotRecursive(dto.url);

    let code: string;
    let attempts = 0;
    do {
      code = Math.random().toString(36).slice(2, 10);
      attempts++;
      if (attempts > 10) throw new Error('Could not generate unique code');
    } while (await this.repo.findByCode(code));

    return this.createLink({ ...dto, code, custom: false }, userId);
  }

  async createCustom(dto: CreateCustomLinkDto, userId?: string) {
    this.validateNotRecursive(dto.url);

    const existing = await this.repo.findByCode(dto.code);
    if (existing) throw new ConflictException('CODE_TAKEN');

    return this.createLink({ ...dto, custom: true }, userId);
  }

  async getInfo(code: string) {
    const link = await this.findOrThrow(code);
    this.checkExpiry(link);

    return {
      protected: link.protected,
      url: link.protected ? null : link.url,
      clicks: link.clicks,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    };
  }

  async access(code: string) {
    const link = await this.findOrThrow(code);
    this.checkExpiry(link);

    if (link.protected) {
      throw new UnauthorizedException('PASSWORD_REQUIRED');
    }

    await this.repo.incrementClicks(link.id);
    return { originalUrl: link.url };
  }

  async unlock(code: string, dto: UnlockLinkDto) {
    const link = await this.findOrThrow(code);
    this.checkExpiry(link);

    if (!link.protected) throw new ConflictException('NOT_PROTECTED');

    const valid = await bcrypt.compare(dto.password, link.password);
    if (!valid) throw new UnauthorizedException('INVALID_PASSWORD');

    await this.repo.incrementClicks(link.id);
    return { url: link.url };
  }

  async delete(code: string, userId?: string) {
    const link = await this.findOrThrow(code);

    if (userId && link.userId && link.userId !== userId) {
      throw new UnauthorizedException('NOT_YOUR_LINK');
    }

    await this.repo.deleteByCode(code);
  }

  async getStats(code: string, userId?: string) {
    const link = await this.findOrThrow(code);

    if (userId && link.userId && link.userId !== userId) {
      throw new UnauthorizedException('NOT_YOUR_LINK');
    }

    const isOwner = Boolean(userId && link.userId && link.userId === userId);
    const url = link.protected && !isOwner ? null : link.url;

    const clicksByDay = await this.repo.getClicksByDay(link.id);
    return {
      code: link.code,
      url,
      clicks: link.clicks,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      clicksByDay,
    };
  }

  async getMyLinks(userId: string) {
    return this.repo.findByUserId(userId);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async createLink(
    data: { url: string; code: string; custom: boolean; password?: string; expiresAt?: string },
    userId?: string,
  ) {
    const hasPassword = Boolean(data.password);
    const hashed = hasPassword ? await bcrypt.hash(data.password, 10) : null;

    return this.repo.create({
      url: data.url,
      code: data.code,
      custom: data.custom,
      protected: hasPassword,
      password: hashed,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      user: userId ? { connect: { id: userId } } : undefined,
    });
  }

  private async findOrThrow(code: string) {
    const link = await this.repo.findByCode(code);
    if (!link) throw new NotFoundException('NOT_FOUND');
    return link;
  }

  private checkExpiry(link: { expiresAt: Date | null; code: string }) {
    if (link.expiresAt && new Date() > link.expiresAt) {
      throw new GoneException('LINK_EXPIRED');
    }
  }

  private validateNotRecursive(url: string) {
    const apiUrl = process.env.API_URL;
    if (apiUrl && url.startsWith(apiUrl)) {
      throw new BadRequestException('RECURSIVE_LINK');
    }
  }
}
