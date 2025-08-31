import { Test, TestingModule } from '@nestjs/testing';
import { MusicLibraryController } from './music-library.controller';

describe('MusicLibraryController', () => {
  let controller: MusicLibraryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MusicLibraryController],
    }).compile();

    controller = module.get<MusicLibraryController>(MusicLibraryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
