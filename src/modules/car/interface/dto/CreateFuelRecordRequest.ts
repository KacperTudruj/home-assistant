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
 *           type: number
 *           format: float
 *           description: Stan licznika (km). Dopuszczalne wartości z przecinkiem.
 *           example: 123456.7
 *         totalPrice:
 *           type: number
 *           format: float
 *           example: 312.45
 *         fuelPricePerLiter:
 *           type: number
 *           format: float
 *           example: 6.89
 *         mileageAtRefuelKm:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Całkowity stan licznika w momencie tankowania. Jeżeli puste, zostanie użyty "meter".
 *           example: 123456.7
 *         tripDistance:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Dystans przejechany od ostatniego tankowania (trip meter).
 *           example: 520.3
 *         fuelType:
 *           type: string
 *           example: "PB95"
 *         drivingMode:
 *           type: string
 *           enum: [MIXED, CITY, HIGHWAY]
 *           default: MIXED
 *           example: MIXED
 */
export class CreateFuelRecordRequest {
    constructor(
        public readonly date: Date,
        public readonly liters: number,
        public readonly meter: number,
        public readonly totalPrice: number,
        public readonly fuelPricePerLiter: number,
        public readonly mileageAtRefuelKm: number | null,
        public readonly tripDistance: number | null,
        public readonly fuelType: string,
        public readonly drivingMode: string = 'MIXED',
    ) { }
}
