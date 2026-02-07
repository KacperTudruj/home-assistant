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
 *         overallTotalSpent:
 *           type: number
 *           format: float
 *           description: Łączna kwota wydana na paliwo
 *           example: 12540.50
 *         overallAvgPricePerLiter:
 *           type: number
 *           format: float
 *           description: Ogólna średnia cena za litr
 *           example: 6.45
 *         overallAvgLitersPerRefuel:
 *           type: number
 *           format: float
 *           description: Średnia ilość litrów na jedno tankowanie
 *           example: 45.2
 *         overallTotalLiters:
 *           type: number
 *           format: float
 *           description: Łączna ilość zatankowanych litrów
 *           example: 1540.5
 */
export class FuelStatisticsResponse {
  avgPricePerLiterPerYear!: { year: number; avgPricePerLiter: number }[];
  totalSpentPerYear!: { year: number; totalSpent: number }[];
  overallAvgConsumptionPer100Km!: number | null;
  overallTotalSpent!: number;
  overallTotalLiters!: number;
  overallAvgPricePerLiter!: number;
  overallAvgLitersPerRefuel!: number;
  overallAvgCostPer100Km!: number | null;
  avgConsumptionPerDrivingMode?: { drivingMode: string, avgConsumption: number | null, avgCost: number | null }[];
}
