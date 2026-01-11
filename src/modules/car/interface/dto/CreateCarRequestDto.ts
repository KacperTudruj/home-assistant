/**
 * @openapi
 * components:
 *   schemas:
 *     CreateCarRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Cienistogrzywy"
 *         soldAt:
 *           type: string
 *           nullable: true
 *           format: date-time
 *           example: "2023-12-31T23:59:59.000Z"
 */
export class CreateCarRequestDto {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly soldAt?: Date,
    ) { }
}
