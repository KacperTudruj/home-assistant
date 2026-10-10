/**
 * @openapi
 * components:
 *   schemas:
 *     ReminderInput:
 *       type: object
 *       required: [title, moduleKey, kind]
 *       description: DATE requires dueDate; MILEAGE requires car, resourceId and dueMileageKm. Exactly one target is allowed. No automatic recurrence.
 *       properties:
 *         title: { type: string, minLength: 1, maxLength: 200 }
 *         moduleKey: { type: string, enum: [general, car] }
 *         resourceId: { type: string, nullable: true, maxLength: 200 }
 *         additionalInfo: { type: string, nullable: true, maxLength: 5000 }
 *         kind: { type: string, enum: [DATE, MILEAGE] }
 *         dueDate: { type: string, format: date, nullable: true }
 *         dueMileageKm: { type: integer, minimum: 0, maximum: 2147483647, nullable: true }
 *         lifecycle: { type: string, enum: [ACTIVE, COMPLETED, ARCHIVED], default: ACTIVE }
 *     ReminderPatch:
 *       type: object
 *       additionalProperties: false
 *       minProperties: 1
 *       description: Context is immutable. When changing kind, explicitly clear the old target with null. Archive with lifecycle ARCHIVED; archived reminders may be edited back to ACTIVE if the context is active.
 *       properties:
 *         title: { type: string, minLength: 1, maxLength: 200 }
 *         additionalInfo: { type: string, nullable: true, maxLength: 5000 }
 *         kind: { type: string, enum: [DATE, MILEAGE] }
 *         dueDate: { type: string, format: date, nullable: true }
 *         dueMileageKm: { type: integer, minimum: 0, maximum: 2147483647, nullable: true }
 *         lifecycle: { type: string, enum: [ACTIVE, COMPLETED, ARCHIVED] }
 *     ReminderResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ReminderInput'
 *         - type: object
 *           properties:
 *             id: { type: string }
 *             createdAt: { type: string, format: date-time }
 *             updatedAt: { type: string, format: date-time }
 *             calculatedAt: { type: string, format: date-time }
 *             status: { type: string, enum: [UPCOMING, DUE, OVERDUE, UNKNOWN, COMPLETED, ARCHIVED] }
 *             remaining:
 *               type: object
 *               nullable: true
 *               properties:
 *                 value: { type: number, description: Signed distance to target; negative means overdue. }
 *                 unit: { type: string, enum: [DAYS, KM] }
 *             contextAvailable: { type: boolean }
 *             contextActive: { type: boolean }
 *             currentMileageKm: { type: number, nullable: true }
 *             mileageRecordedAt: { type: string, format: date-time, nullable: true }
 *             mileageSource: { type: string, enum: [READING, PURCHASE], nullable: true }
 *   responses:
 *     ReminderOK:
 *       description: Reminder with progress calculated in Europe/Warsaw. Completed and archived reminders have no countdown.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReminderResponse' }
 *     ReminderInvalid:
 *       description: Invalid body, filters, module or target (JSON error message).
 *     ReminderMissing:
 *       description: Reminder or referenced resource does not exist (JSON error message).
 *     ReminderInactive:
 *       description: Resource is inactive. Reading and archiving remain available (JSON error message).
 * /api/reminders:
 *   get:
 *     tags: [Reminders]
 *     summary: List reminders, including completed and archived unless filtered
 *     parameters:
 *       - { in: query, name: moduleKey, schema: { type: string, enum: [general, car] } }
 *       - { in: query, name: resourceId, description: Requires moduleKey., schema: { type: string } }
 *       - { in: query, name: lifecycle, schema: { type: string, enum: [ACTIVE, COMPLETED, ARCHIVED] } }
 *     responses:
 *       200:
 *         description: Newest created first; missing resources are marked by contextAvailable false.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ReminderResponse' }
 *       400: { $ref: '#/components/responses/ReminderInvalid' }
 *   post:
 *     tags: [Reminders]
 *     summary: Create a standalone reminder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReminderInput' }
 *     responses:
 *       201: { $ref: '#/components/responses/ReminderOK' }
 *       400: { $ref: '#/components/responses/ReminderInvalid' }
 *       404: { $ref: '#/components/responses/ReminderMissing' }
 *       409: { $ref: '#/components/responses/ReminderInactive' }
 * /api/reminders/{id}:
 *   patch:
 *     tags: [Reminders]
 *     summary: Edit or archive a reminder without changing its context
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReminderPatch' }
 *     responses:
 *       200: { $ref: '#/components/responses/ReminderOK' }
 *       400: { $ref: '#/components/responses/ReminderInvalid' }
 *       404: { $ref: '#/components/responses/ReminderMissing' }
 *       409: { $ref: '#/components/responses/ReminderInactive' }
 * /api/reminders/{id}/complete:
 *   post:
 *     tags: [Reminders]
 *     summary: Complete once without creating a new deadline; repeated completion has no effect
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { $ref: '#/components/responses/ReminderOK' }
 *       400: { $ref: '#/components/responses/ReminderInvalid' }
 *       404: { $ref: '#/components/responses/ReminderMissing' }
 *       409: { $ref: '#/components/responses/ReminderInactive' }
 */
export {};
