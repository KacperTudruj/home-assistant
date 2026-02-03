import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const AUDI_ID = 'a729f102-77a6-4f14-8a21-283c827b2bac';
const HONDA_ID = '0506413c-c52c-4a4c-b4d3-c619e1c8a5db';

async function importCsv(filePath: string, carId: string) {
    console.log(`Importing ${filePath} for car ${carId}...`);
    
    if (!fs.existsSync(filePath)) {
        console.error(`File ${filePath} not found!`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(';');
    
    // Honda: Data;licznik (Km);Zaplacilem;zl/L;L;...;Przebieg (col 18, 0-indexed)
    // Audi: Data;licznik (Km);Zaplacilem;zl/L;L;...
    
    let importedCount = 0;
    let withOdometer = 0;
    let withoutOdometer = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith(';')) continue;
        
        const cols = line.split(';');
        if (cols.length < 5) continue;

        const dateStr = cols[0]; // DD.MM.YYYY or similar
        const tripStr = cols[1]; // Dystans od ostatniego (licznik (Km))
        const paidStr = cols[2]; // Zaplacilem
        const pricePerLStr = cols[3]; // zl/L
        const litersStr = cols[4]; // L
        
        // Optional: mileageAtRefuelKm (odometer)
        let odometer: number | null = null;
        if (carId === HONDA_ID && cols[18]) {
            const val = parseValue(cols[18]);
            if (val > 0) odometer = val;
        }

        const date = parseDate(dateStr);
        const liters = parseValue(litersStr);
        const totalPrice = parseValue(paidStr);
        const tripDistance = parseValue(tripStr);

        if (!date || isNaN(liters) || liters <= 0 || isNaN(totalPrice) || totalPrice <= 0) {
            skipped++;
            continue;
        }

        // We don't have absolute odometer for all records in CSV.
        // For the import, we'll use a trick: 
        // If we don't have odometer, we'll store tripDistance as mileageAtRefuelKm 
        // OR we can try to accumulate it if we start from a known point.
        // BUT the Car domain expects mileageAtRefuelKm to be absolute.
        // If the CSV doesn't provide absolute mileage for every record, 
        // we might have issues with validations if we just put trip there.
        
        // Looking at Honda CSV: row 2 has Przebieg 176703.
        // Actually, if we only have trip, we can't easily reconstruct the whole history without a starting point.
        // However, the user said: "stan licznika całkowitego... pomagam sobie oszacować błąd...".
        
        await prisma.fuelRecord.create({
            data: {
                carId,
                date,
                liters,
                totalPrice,
                mileageAtRefuelKm: odometer || 0,
                tripDistance: tripDistance,
                fuelType: 'PB95'
            }
        });
        importedCount++;
        if (odometer && odometer > 0) withOdometer++; else withoutOdometer++;
    }
    
    console.log(`Imported ${importedCount} records for car ${carId}. (with odometer: ${withOdometer}, without odometer: ${withoutOdometer}, skipped: ${skipped})`);
}

function parseDate(str: string): Date | null {
    if (!str) return null;
    // Handle formats like 07.12.2023 or 06.kwi
    const parts = str.split('.');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    // Very basic, might need more for "06.kwi"
    return null;
}

function parseValue(str: string): number {
    if (!str) return 0;
    // Remove " z?", replace "," with "."
    const clean = str.replace(' z?', '').replace(' zł', '').replace(/\s/g, '').replace(',', '.');
    return parseFloat(clean);
}

async function main() {
    try {
        // Set mileageAtPurchase = null for target cars
        await prisma.car.update({ where: { id: AUDI_ID }, data: { mileageAtPurchase: null as any } });
        await prisma.car.update({ where: { id: HONDA_ID }, data: { mileageAtPurchase: null as any } });

        await importCsv(path.join(__dirname, 'Audi a3 1999Auto Spalanie.csv'), AUDI_ID);
        await importCsv(path.join(__dirname, 'HONDA CR-v 2009 Auto Spalanie.csv'), HONDA_ID);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
