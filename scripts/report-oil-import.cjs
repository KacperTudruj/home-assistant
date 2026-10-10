const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const rows = await prisma.legacyOilReminderImport.findMany({ orderBy: { carName: 'asc' } });
    console.table(rows.map(({ carName, carId, status, dueMileageKm, note }) => ({ carName, carId, status, dueMileageKm, note })));
    if (!rows.length) console.log('No legacy oil settings required migration.');
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
}).finally(() => prisma.$disconnect());
