import { Test, TestingModule } from '@nestjs/testing';
import { MusicLibraryService } from './music-library.service';
import { PrismaService } from 'src/prisma/prisma.service';

jest.mock(
  'music-metadata',
  () => ({
    parseFile: jest.fn().mockResolvedValue({
      common: { track: { no: 1 }, picture: [] },
      format: { duration: 180 },
    }),
  }),
  { virtual: true },
);

const mockPrismaService = {
  artist: {
    findMany: jest
      .fn()
      .mockResolvedValue([
        { id: 1, name: 'Test Artist', avatarUrl: 'test.jpg' },
      ]),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  album: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  song: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  playlist: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('MusicLibraryService', () => {
  let service: MusicLibraryService;
  let prisma: PrismaService;

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
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllArtists', () => {
    it('should return an array of artists', async () => {
      const result = await service.findAllArtists();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Artist');
      expect(prisma.artist.findMany).toHaveBeenCalled();
    });
  });
});
