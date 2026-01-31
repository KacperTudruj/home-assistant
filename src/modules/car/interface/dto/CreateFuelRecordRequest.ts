/**
 * @openapi
 * components:
 *   schemas:
 *     CreateFuelRecordRequest:
 *       type: object
 *       required:
 *         - date
 *         - liters
 *         - totalPrice
 *         - fuelPricePerLiter
 *         - fuelType
 *       properties:
 *         date:
 *           type: string
 *           description: Data tankowania w formacie YYYY.MM.DD
 *           example: "2023.12.07"
 *           pattern: "^[0-9]{4}\\.[0-9]{2}\\.[0-9]{2}$"
 *         liters:
 *           type: number
 *           format: float
 *           example: 45.5
 *         meter:
 *           type: integer
 *           description: Stan licznika (km)
 *           example: 123456
 *         totalPrice:
 *           type: number
 *           format: float
 *           example: 312.45
 *         fuelPricePerLiter:
 *           type: number
 *           format: float
 *           example: 6.89
 *         mileageAtRefuelKm:
 *           type: integer
 *           nullable: true
 *           example: 520
 *         fuelType:
 *           type: string
 *           example: "PB95"
 */
export class CreateFuelRecordRequest {
    constructor(
        public readonly date: Date,
        public readonly liters: number,
        public readonly meter: number,
        public readonly totalPrice: number,
        public readonly fuelPricePerLiter: number,
        public readonly mileageAtRefuelKm: number | null,
        public readonly fuelType: string,
    ) { }
}
