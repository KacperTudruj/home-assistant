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
export class GetFuelResponse {
    constructor(
        public readonly id: string,
        public readonly date: string,
        public readonly liters: number,
        public readonly meter: number,
        public readonly totalPrice: number,
        public readonly fuelPricePerLiter: number,
        public readonly mileageAtRefuelKm: number | null,
        public readonly fuelType: string,
    ) { }
}