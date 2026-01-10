/**
 * @openapi
 * components:
 *   schemas:
 *     CreateCommentaryRequest:
 *       type: object
 *       required:
 *         - text
 *         - featureKeys
 *         - commentatorId
 *       properties:
 *         text:
 *           type: string
 *           example: "Jeden komentarz, by wszystkimi rządzić."
 *         featureKeys:
 *           type: array
 *           items:
 *             type: string
 *           example: ["car-log"]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["epic", "lotr"]
 *         commentatorId:
 *           type: string
 *           example: "sauron"
 */
export class CreateCommentaryRequestDto {
    text!: string;
    featureKeys!: string[];
    tags?: string[];
    commentatorId!: string;
}
