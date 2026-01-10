/**
 * @openapi
 * components:
 *   schemas:
 *     Commentator:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "legolas"
 *         key:
 *           type: string
 *           example: "legolas"
 *         name:
 *           type: string
 *           example: "Legolas 🏹"
 *         style:
 *           type: string
 *           example: "Zawsze trafia, nigdy nie pudłuje."
 *         enabled:
 *           type: boolean
 *           example: true
 */
export class CommentatorDto {
    id!: string;
    key!: string;
    name!: string;
    style!: string;
    enabled!: boolean;
}
