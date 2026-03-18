import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FavoritesService {
    private readonly logger = new Logger(FavoritesService.name);

    constructor(private prisma: PrismaService) { }

    async getFavoriteSongs(userId: number) {
        const favorites = await this.prisma.favoriteSong.findMany({
            where: { userId },
            include: {
                song: {
                    include: {
                        album: {
                            include: {
                                artists: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return favorites.map((f) => ({
            ...f.song,
            favoritedAt: f.createdAt,
        }));
    }

    async toggleFavoriteSong(userId: number, songId: number) {
        const existing = await this.prisma.favoriteSong.findUnique({
            where: { userId_songId: { userId, songId } },
        });

        if (existing) {
            await this.prisma.favoriteSong.delete({
                where: { id: existing.id },
            });
            this.logger.log(`取消收藏歌曲: userId=${userId}, songId=${songId}`);
            return { isFavorited: false };
        }

        await this.prisma.favoriteSong.create({
            data: { userId, songId },
        });
        this.logger.log(`收藏歌曲: userId=${userId}, songId=${songId}`);
        return { isFavorited: true };
    }

    async isSongFavorited(userId: number, songId: number) {
        const existing = await this.prisma.favoriteSong.findUnique({
            where: { userId_songId: { userId, songId } },
        });
        return { isFavorited: !!existing };
    }

    async getFavoriteAlbums(userId: number) {
        const favorites = await this.prisma.favoriteAlbum.findMany({
            where: { userId },
            include: {
                album: {
                    include: {
                        artists: true,
                        _count: { select: { songs: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return favorites.map((f) => ({
            ...f.album,
            favoritedAt: f.createdAt,
        }));
    }

    async toggleFavoriteAlbum(userId: number, albumId: number) {
        const existing = await this.prisma.favoriteAlbum.findUnique({
            where: { userId_albumId: { userId, albumId } },
        });

        if (existing) {
            await this.prisma.favoriteAlbum.delete({
                where: { id: existing.id },
            });
            this.logger.log(`取消收藏专辑: userId=${userId}, albumId=${albumId}`);
            return { isFavorited: false };
        }

        await this.prisma.favoriteAlbum.create({
            data: { userId, albumId },
        });
        this.logger.log(`收藏专辑: userId=${userId}, albumId=${albumId}`);
        return { isFavorited: true };
    }

    async getFollowedArtists(userId: number) {
        const follows = await this.prisma.followedArtist.findMany({
            where: { userId },
            include: {
                artist: {
                    include: {
                        _count: { select: { albums: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return follows.map((f) => ({
            ...f.artist,
            followedAt: f.createdAt,
        }));
    }

    async toggleFollowArtist(userId: number, artistId: number) {
        const existing = await this.prisma.followedArtist.findUnique({
            where: { userId_artistId: { userId, artistId } },
        });

        if (existing) {
            await this.prisma.followedArtist.delete({
                where: { id: existing.id },
            });
            this.logger.log(`取消关注艺术家: userId=${userId}, artistId=${artistId}`);
            return { isFollowing: false };
        }

        await this.prisma.followedArtist.create({
            data: { userId, artistId },
        });
        this.logger.log(`关注艺术家: userId=${userId}, artistId=${artistId}`);
        return { isFollowing: true };
    }

    async getFavoriteIds(userId: number) {
        const [songs, albums, artists] = await Promise.all([
            this.prisma.favoriteSong.findMany({
                where: { userId },
                select: { songId: true },
            }),
            this.prisma.favoriteAlbum.findMany({
                where: { userId },
                select: { albumId: true },
            }),
            this.prisma.followedArtist.findMany({
                where: { userId },
                select: { artistId: true },
            }),
        ]);

        return {
            songIds: songs.map((s) => s.songId),
            albumIds: albums.map((a) => a.albumId),
            artistIds: artists.map((a) => a.artistId),
        };
    }
}
