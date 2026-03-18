import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    // 1. Create test users
    console.log('Creating test users...');
    const user1 = await prisma.user.upsert({
      where: { email: 'user1@test.com' },
      update: {},
      create: {
        email: 'user1@test.com',
        username: 'user1',
        passwordHash: 'fake-hash',
      },
    });

    const user2 = await prisma.user.upsert({
      where: { email: 'user2@test.com' },
      update: {},
      create: {
        email: 'user2@test.com',
        username: 'user2',
        passwordHash: 'fake-hash',
      },
    });

    console.log('Users created:', user1.id, user2.id);

    // 2. Create a conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: { id: { in: [user1.id, user2.id] } }
        }
      }
    });

    if (!conversation) {
      console.log('Creating conversation...');
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            connect: [{ id: user1.id }, { id: user2.id }],
          },
        },
      });
    }

    console.log('Conversation ready:', conversation.id);

    // 3. Create a message
    await prisma.message.create({
      data: {
        content: 'Hello',
        senderId: user2.id,
        conversationId: conversation.id,
        isRead: false,
      },
    });

    console.log('Message created');

    // 4. Test the query
    console.log('Testing getConversations for userId:', user1.id);
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: user1.id },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarPath: true,
            avatarPosition: true,
            updatedAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: user1.id }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });

    console.log('Raw result _count:', JSON.stringify(conversations[0]._count, null, 2));

    const mapped = conversations.map(c => ({
      ...c,
      unreadCount: (c as any)._count?.messages || 0
    }));

    console.log('Mapped unreadCount:', mapped[0].unreadCount);
    console.log('Success!');
  } catch (error) {
    console.error('FAILED with error:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
