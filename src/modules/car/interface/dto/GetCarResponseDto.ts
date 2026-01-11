/**
 * @openapi
 * components:
 *   schemas:
 *     CarResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "7c8a4e5a-9d4c-4c7f-b5d2-123456789abc"
 *         name:
 *           type: string
 *           example: "Cienistogrzywy"
 *         soldAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2023-12-31T23:59:59.000Z"
 */
export class CarResponseDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly soldAt?: Date,
  ) { }
}