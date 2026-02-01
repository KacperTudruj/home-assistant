/**
 * @openapi
 * components:
 *   schemas:
 *     ItemGetFuelResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "fuel-001"
 *         date:
 *           type: string
 *           description: Data tankowania (YYYY-MM-DD)
 *           example: "2023-12-07"
 *         fuelType:
 *           type: string
 *           description: Rodzaj paliwa
 *           example: "PB95"
 *         liters:
 *           type: number
 *           format: float
 *           description: Ilość zatankowanego paliwa
 *           example: 45.5
 *         totalPrice:
 *           type: number
 *           format: float
 *           description: Całkowity koszt tankowania
 *           example: 312.45
 *         mileageAtRefuelKm:
 *           type: integer
 *           nullable: true
 *           description: Kilometry przejechane od poprzedniego tankowania
 *           example: 520
 *         averageConsumptionLPer100Km:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Średnie spalanie (l / 100 km)
 *           example: 8.75
 *         costPer100Km:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Koszt przejechania 100 km
 *           example: 60.29
 *         daysSincePreviousRefuel:
 *           type: integer
 *           nullable: true
 *           description: Liczba dni od poprzedniego tankowania
 *           example: 25
 */

export class ItemGetFuelResponse {
    constructor(
        public readonly id: string,
        public readonly date: string,
        public readonly fuelType: string,
        public readonly liters: number,
        public readonly totalPrice: number,
        public readonly mileageAtRefuelKm: number | null,
        public readonly averageConsumptionLPer100Km: number | null,
        public readonly costPer100Km: number | null,
        public readonly daysSincePreviousRefuel: number | null,
    ) {}
}
