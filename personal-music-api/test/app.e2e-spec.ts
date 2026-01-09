import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { MusicLibraryService } from './../src/modules/music-library/music-library.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const mockMusicLibraryService = {
    findAllArtists: jest
      .fn()
      .mockResolvedValue([{ id: 1, name: 'E2E Artist' }]),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MusicLibraryService)
      .useValue(mockMusicLibraryService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/artists (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/artists')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);

        expect(res.body[0].name).toBe('E2E Artist');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
