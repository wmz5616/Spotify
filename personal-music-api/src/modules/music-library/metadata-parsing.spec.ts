import { Test, TestingModule } from '@nestjs/testing';
import { MusicLibraryService } from './music-library.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as mm from 'music-metadata';
import * as path from 'path';

jest.mock(
    'music-metadata',
    () => ({
        parseFile: jest.fn(),
    }),
    { virtual: true },
);

const mockPrismaService = {
    artist: { upsert: jest.fn() },
    album: { upsert: jest.fn() },
    song: { upsert: jest.fn() },
};

describe('Metadata Parsing Logic', () => {
    let service: MusicLibraryService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MusicLibraryService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<MusicLibraryService>(MusicLibraryService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const extractMetadata = async (filePath: string, rootDir: string) => {
        return (service as any).extractMetadata(filePath, rootDir);
    };

    it('should parse Artist and Title from filename "Artist - Title.ext"', async () => {

        const rootDir = '/music';
        const filePath = path.join(rootDir, 'G.E.M.邓紫棋', 'T.I.M.E', 'G.E.M.邓紫棋 - 11.flac');

        (mm.parseFile as jest.Mock).mockResolvedValue({
            common: {
                title: 'Wrong Metadata Title',
                track: { no: 1 }
            },
            format: { duration: 200 }
        });

        const result = await extractMetadata(filePath, rootDir);

        expect(result).toBeDefined();
        expect(result.artist).toBe('G.E.M.邓紫棋');
        expect(result.title).toBe('11');
        expect(result.album).toBe('T.I.M.E');
    });

    it('should ignore Artist in filename and use Directory Artist', async () => {

        const rootDir = '/music';
        const filePath = path.join(rootDir, 'G.E.M.邓紫棋', 'T.I.M.E', 'OtherArtist - 11.flac');

        (mm.parseFile as jest.Mock).mockResolvedValue({
            common: { title: 'Embedded' },
            format: { duration: 200 }
        });

        const result = await extractMetadata(filePath, rootDir);

        expect(result).toBeDefined();
        expect(result.artist).toBe('G.E.M.邓紫棋');
        expect(result.title).toBe('11');
        expect(result.album).toBe('T.I.M.E');
    });

    it('should parse Chinese Artist directory correctly', async () => {
        const rootDir = '/music';
        const filePath = path.join(rootDir, 'G.E.M.邓紫棋', 'T.I.M.E', 'G.E.M.邓紫棋 - 海阔天空.flac');

        (mm.parseFile as jest.Mock).mockResolvedValue({
            common: { title: 'Embedded' },
            format: { duration: 200 }
        });

        const result = await extractMetadata(filePath, rootDir);

        expect(result.artist).toBe('G.E.M.邓紫棋');
        expect(result.title).toBe('海阔天空');
    });

    it('should fallback to normal parsing if filename does not match pattern', async () => {
        const rootDir = '/music';
        const filePath = path.join(rootDir, 'ArtistName', 'AlbumName', '01. Title.mp3');

        (mm.parseFile as jest.Mock).mockResolvedValue({
            common: {
                title: 'Embedded Metadata Title',
                track: { no: 1 }
            },
            format: { duration: 180 }
        });

        const result = await extractMetadata(filePath, rootDir);

        expect(result.artist).toBe('ArtistName');
        expect(result.album).toBe('AlbumName');
        expect(result.title).toBe('Embedded Metadata Title');
    });

    it('should prioritize filename parsing even if metadata exists', async () => {
        const rootDir = '/music';
        const filePath = path.join(rootDir, 'Artist', 'Album', 'Artist - My Song.mp3');

        (mm.parseFile as jest.Mock).mockResolvedValue({
            common: { title: 'Metadata Title' },
            format: { duration: 100 }
        });

        const result = await extractMetadata(filePath, rootDir);

        expect(result.artist).toBe('Artist');
        expect(result.title).toBe('My Song');
        expect(result.title).not.toBe('Metadata Title');
    });
});
