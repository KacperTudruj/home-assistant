import { MileageSummaryDto } from "./MileageSummary";

/**
 * @openapi
 * components:
 *   schemas:
 *     GetCarResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "7c8a4e5a-9d4c-4c7f-b5d2-123456789abc"
 *         name:
 *           type: string
 *           example: "Cienistogrzywy"
 *         year:
 *           type: integer
 *           example: 2020
 *         isActive:
 *           type: boolean  
 *           example: true
 *         soldAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2023-12-31T23:59:59.000Z"
 *         mileage: 
 *           $ref: '#/components/schemas/MileageSummary'
 *         engine:
 *           type: string
 *           nullable: true
 *           example: "2.0 TDI"
 *         vin:
 *           type: string
 *           nullable: true
 *           example: "WVWZZZ1JZ1W123456"
 */
export class GetCarResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly year: number,
    public readonly isActive: boolean,
    public readonly soldAt: Date | null,
    public readonly mileage: MileageSummaryDto,
    public readonly engine: string | null = null,
    public readonly vin: string | null = null,
  ) { }
}