/**
 * @openapi
 * components:
 *   schemas:
 *     GetFuelResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "7c8a4e5a-9d4c-4c7f-b5d2-123456789abc"
 *         date:
 *           type: string
 *           description: Data tankowania w formacie YYYY.MM.DD
 *           example: "2023.12.07"
 *         liters:
 *           type: number
 *           format: float
 *           description: Ilość zatankowanego paliwa (litry)
 *           example: 45.5
 *         meter:
 *           type: integer
 *           description: Stan licznika w momencie tankowania (km)
 *           example: 214350
 *         totalPrice:
 *           type: number
 *           format: float
 *           description: Łączny koszt tankowania
 *           example: 312.45
 *         fuelPricePerLiter:
 *           type: number
 *           format: float
 *           description: Cena paliwa za litr
 *           example: 6.89
 *         mileageAtRefuelKm:
 *           type: integer
 *           nullable: true
 *           description: Liczba kilometrów przejechanych od poprzedniego tankowania
 *           example: 520
 *         fuelConsumptionPer100Km:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Średnie spalanie na 100 km
 *           example: 8.75
 *         costPer100Km:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Koszt przejechania 100 km
 *           example: 60.05
 *         daysSincePreviousRefuel:
 *           type: integer
 *           nullable: true
 *           description: Liczba dni od poprzedniego tankowania
 *           example: 12
 *         fuelType:
 *           type: string
 *           description: Rodzaj paliwa
 *           example: "PB95"
 */
export class GetFuelResponse {
    constructor(
        public readonly id: string,
        public readonly date: string,
        public readonly liters: number,
        public readonly meter: number,
        public readonly totalPrice: number,
        public readonly fuelPricePerLiter: number,
        public readonly mileageAtRefuelKm: number | null,
        public readonly fuelConsumptionPer100Km: number | null,
        public readonly costPer100Km: number | null,
        public readonly daysSincePreviousRefuel: number | null,
        public readonly fuelType: string,
    ) {}
}
