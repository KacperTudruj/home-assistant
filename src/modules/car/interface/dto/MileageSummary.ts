/**
 * @openapi
 * components:
 *   schemas:
 *     MileageSummary:
 *       type: object
 *       description: Podsumowanie przebiegu samochodu
 *       properties:
 *         atPurchase:
 *           type: integer
 *           example: 182000
 *           description: Przebieg w momencie zakupu
 *         current:
 *           type: integer
 *           example: 214350
 *           description: Aktualny przebieg
 *         ownedDistance:
 *           type: integer
 *           example: 32350
 *           description: Przejechany dystans jako właściciel
 */
export class MileageSummaryDto {
  atPurchase!: number;
  current!: number;
  ownedDistance!: number;
}
