/**
 * @openapi
 * components:
 *   schemas:
 *     FeatureResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         key:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         icon:
 *           type: string
 *         route:
 *           type: string
 *         enabled:
 *           type: boolean
 *         order:
 *           type: integer
 */
export class FeatureResponseDto {
    constructor(
        public readonly id: string,
        public readonly key: string,
        public readonly name: string,
        public readonly description: string,
        public readonly icon: string,
        public readonly route: string,
        public readonly enabled: boolean,
        public readonly order: number,
    ) { }
}
