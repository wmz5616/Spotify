import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const albums = await prisma.album.findMany({
    take: 10,
    include: {
      artists: true,
      _count: { select: { songs: true } },
    },
  });

  console.log(JSON.stringify(albums, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
