/**
 * @openapi
 * components:
 *   schemas:
 *     CreateCommentaryResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cmt-1-ring-001"
 *         text:
 *           type: string
 *           example: "Jeden komentarz, by wszystkimi rządzić."
 */
export class CreateCommentaryResponseDto {
    id!: string;
    text!: string;
}
