/**
 * @openapi
 * components:
 *   schemas:
 *     CommentaryResponse:
 *       type: object
 *       properties:
 *         text:
 *           type: string
 *           example: "Nie przejdziesz! – powiedział Gandalf, blokując drogę Balrogowi."
 *         commentatorId:
 *           type: string
 *           example: "gandalf-the-grey"
 */
export class CommentaryResponseDto {
    text!: string;
    commentatorId!: string;
}
