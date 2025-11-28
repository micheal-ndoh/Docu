import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubmissions() {
    try {
        const submissions = await prisma.submission.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        console.log('Total submissions in database:', submissions.length);
        console.log('\nSubmissions:');
        submissions.forEach((sub, idx) => {
            console.log(`${idx + 1}. ID: ${sub.id}, GIS Docusign ID: ${sub.docusealId}, User: ${sub.userId}, Status: ${sub.status}, Email: ${sub.submitterEmail}`);
        });

        // Also check users
        const users = await prisma.user.findMany();
        console.log('\n\nTotal users:', users.length);
        users.forEach((user, idx) => {
            console.log(`${idx + 1}. ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSubmissions();
