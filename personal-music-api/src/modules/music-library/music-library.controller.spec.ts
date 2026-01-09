import { Test, TestingModule } from '@nestjs/testing';
import { MusicLibraryController } from './music-library.controller';
import { MusicLibraryService } from './music-library.service';

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

describe('MusicLibraryController', () => {
  let controller: MusicLibraryController;

  const mockMusicLibraryService = {
    scanAndSaveMusic: jest.fn(),
    findAllArtists: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MusicLibraryController],
      providers: [
        {
          provide: MusicLibraryService,
          useValue: mockMusicLibraryService,
        },
      ],
    }).compile();

    controller = module.get<MusicLibraryController>(MusicLibraryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
