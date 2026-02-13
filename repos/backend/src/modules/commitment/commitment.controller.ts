import { Context } from 'hono';
import { CommitmentService } from './services/commitment.service';
import { createSuccessResponse, createErrorResponse, validationError, serverError } from '../../shared/response/response.helper';
import { createCommitmentSchema, logCommitmentSchema } from '../../shared/validation/validation.schemas';

export class CommitmentController {
    private commitmentService: CommitmentService;

    constructor(commitmentService: CommitmentService) {
        this.commitmentService = commitmentService;
    }

    getCommitments() {
        return async (c: Context) => {
            try {
                const userId = c.get('userId');
                const commitments = await this.commitmentService.getCommitments(userId);
                return c.json(createSuccessResponse('S001', 'Commitments retrieved', commitments));
            } catch (error) {
                return c.json(serverError('Internal server error'), 500);
            }
        };
    }

    create() {
        return async (c: Context) => {
            try {
                const userId = c.get('userId');
                const body = await c.req.json();

                const validation = createCommitmentSchema.safeParse(body);
                if (!validation.success) {
                    // map Zod error to expected error format
                    const errors: Record<string, string[]> = {};
                    const fieldErrors = validation.error.flatten().fieldErrors;
                    for (const [key, value] of Object.entries(fieldErrors)) {
                        errors[key] = Array.isArray(value) ? value : [];
                    }
                    return c.json(validationError(errors), 400);
                }

                const commitment = await this.commitmentService.create(userId, validation.data);
                return c.json(createSuccessResponse('S002', 'Commitment created', commitment), 201);
            } catch (error) {
                if (error instanceof Error && error.message === 'Invalid scheduled days') {
                    return c.json(createErrorResponse('E001', error.message), 400);
                }
                return c.json(serverError('Internal server error'), 500);
            }
        };
    }

    logCommitment() {
        return async (c: Context) => {
            try {
                const userId = c.get('userId');
                const commitmentId = c.req.param('id');
                const body = await c.req.json();

                const validation = logCommitmentSchema.safeParse(body);
                if (!validation.success) {
                    const errors: Record<string, string[]> = {};
                    const fieldErrors = validation.error.flatten().fieldErrors;
                    for (const [key, value] of Object.entries(fieldErrors)) {
                        errors[key] = Array.isArray(value) ? value : [];
                    }
                    return c.json(validationError(errors), 400);
                }

                const log = await this.commitmentService.logCommitment(userId, commitmentId, validation.data);
                return c.json(createSuccessResponse('S003', 'Commitment logged', log), 201);
            } catch (error) {
                if (error instanceof Error && error.message === 'Commitment not found') {
                    return c.json(createErrorResponse('E004', 'Commitment not found'), 404);
                }
                return c.json(serverError('Internal server error'), 500);
            }
        };
    }
}
