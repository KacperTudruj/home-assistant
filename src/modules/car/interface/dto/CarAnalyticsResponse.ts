/**
 * @openapi
 * components:
 *   schemas:
 *     AnalyticsChart:
 *       type: object
 *       required: [id, type, title, description, xAxis, yAxis, series, referenceLines]
 *       properties:
 *         id: { type: string }
 *         type: { type: string, enum: [line] }
 *         title: { type: string }
 *         description: { type: string }
 *         xAxis:
 *           type: object
 *           properties:
 *             type: { type: string, enum: [date] }
 *             label: { type: string }
 *         yAxis:
 *           type: object
 *           properties:
 *             label: { type: string }
 *             unit: { type: string }
 *         referenceLines:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               value: { type: number }
 *               label: { type: string }
 *         series:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id: { type: string }
 *               label: { type: string }
 *               points:
 *                 type: array
 *                 maxItems: 1000
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     x: { type: string, format: date }
 *                     y: { type: number, nullable: true }
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label: { type: string }
 *                           value: { type: number }
 *                           unit: { type: string }
 *     FuelAnalyticsPoint:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         date: { type: string, format: date }
 *         fuelType: { type: string, enum: [PB95, PB98, DIESEL, LPG, ELECTRIC] }
 *         mileageKm: { type: number, nullable: true }
 *         distanceKm: { type: number, nullable: true }
 *         consumption: { type: number, nullable: true }
 *         costPer100Km: { type: number, nullable: true }
 *         pricePerLiter: { type: number, nullable: true }
 *         improvement: { type: number, nullable: true }
 *         issues:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               metric: { type: string, enum: [consumption, costPer100Km, pricePerLiter, improvement] }
 *               reason:
 *                 type: string
 *                 enum: [MISSING_DISTANCE, INVALID_DISTANCE, AMBIGUOUS_ORDER, FUEL_CHANGED, INVALID_LITERS, INVALID_PRICE, INSUFFICIENT_HISTORY, UNSUPPORTED_FUEL, NON_FINITE_RESULT]
 */
export {};
