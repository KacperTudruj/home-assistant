/**
 * @openapi
 * components:
 *   schemas:
 *     FuelStatisticsResponse:
 *       type: object
 *       description: Statystyki tankowań i spalania dla samochodu
 *       properties:
 *         avgPricePerLiterPerYear:
 *           type: array
 *           description: Średnia (ważona litrami) cena paliwa za litr w danym roku
 *           items:
 *             type: object
 *             properties:
 *               year:
 *                 type: integer
 *                 example: 2024
 *               avgPricePerLiter:
 *                 type: number
 *                 format: float
 *                 example: 6.58
 *         totalSpentPerYear:
 *           type: array
 *           description: Łączna kwota wydana na paliwo w danym roku
 *           items:
 *             type: object
 *             properties:
 *               year:
 *                 type: integer
 *                 example: 2024
 *               totalSpent:
 *                 type: number
 *                 format: float
 *                 example: 3540.25
 *         overallAvgConsumptionPer100Km:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Ogólne średnie spalanie (l/100km) obliczane na podstawie różnic przebiegu między kolejnymi tankowaniami
 *           example: 8.2
 */
export class FuelStatisticsResponse {
  avgPricePerLiterPerYear!: { year: number; avgPricePerLiter: number }[];
  totalSpentPerYear!: { year: number; totalSpent: number }[];
  overallAvgConsumptionPer100Km!: number | null;
}
