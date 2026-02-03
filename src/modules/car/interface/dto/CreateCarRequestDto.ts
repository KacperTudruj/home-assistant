/**
 * @openapi
 * components:
 *   schemas:
 *     CreateCarRequest:
 *       type: object
 *       required:
 *         - name
 *         - year
 *       properties:
 *         name:
 *           type: string
 *           example: "Cienistogrzywy"
 *         year:
 *           type: integer
 *           example: 2020
 *         soldAt:
 *           type: string
 *           nullable: true
 *           format: date-time
 *           example: "2023-12-31T23:59:59.000Z"
 *         mileageAtPurchase:
 *           type: integer
 *           nullable: true
 *           example: 182000
 */
export class CreateCarRequestDto {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly year: number,
        public readonly soldAt?: Date,
        public readonly mileageAtPurchase?: number,
    ) { }
}
