import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LinksRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.LinkCreateInput) {
    return this.prisma.link.create({ data });
  }

  async findByCode(code: string) {
    return this.prisma.link.findUnique({ where: { code } });
  }

  async incrementClicks(id: string) {
    return this.prisma.$transaction([
      this.prisma.link.update({
        where: { id },
        data: { clicks: { increment: 1 } },
      }),
      this.prisma.clickEvent.create({
        data: { linkId: id },
      }),
    ]);
  }

  async deleteByCode(code: string) {
    return this.prisma.link.delete({ where: { code } });
  }

  async getClicksByDay(linkId: string) {
    const events = await this.prisma.clickEvent.findMany({
      where: { linkId },
      select: { clickedAt: true },
      orderBy: { clickedAt: 'asc' },
    });

    const grouped = events.reduce<Record<string, number>>((acc, e) => {
      const day = e.clickedAt.toISOString().slice(0, 10);
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, clicks]) => ({ date, clicks }));
  }

  async findByUserId(userId: string) {
    return this.prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
