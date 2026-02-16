import { Context } from 'hono';
import { CommitmentService } from './services/commitment.service';
import { createSuccessResponse, createErrorResponse, serverError } from '../../shared/response/response.helper';

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
                throw error; // Let global error handler handle it
            }
        };
    }

    create() {
        return async (c: Context) => {
            try {
                const userId = c.get('userId');
                // Get validated data from middleware, or parse body for backward compatibility
                let body = c.get('validatedData');
                if (!body) {
                    body = await c.req.json();
                }

                const commitment = await this.commitmentService.create(userId, body);
                return c.json(createSuccessResponse('S002', 'Commitment created', commitment), 201);
            } catch (error) {
                if (error instanceof Error && error.message === 'Invalid scheduled days') {
                    return c.json(createErrorResponse('E001', error.message), 400);
                }
                throw error; // Let global error handler handle it
            }
        };
    }

    logCommitment() {
        return async (c: Context) => {
            try {
                const userId = c.get('userId');
                const commitmentId = c.req.param('id');
                // Get validated data from middleware, or parse body for backward compatibility
                let body = c.get('validatedData');
                if (!body) {
                    body = await c.req.json();
                }

                const log = await this.commitmentService.logCommitment(userId, commitmentId, body);
                return c.json(createSuccessResponse('S003', 'Commitment logged', log), 201);
            } catch (error) {
                if (error instanceof Error && error.message === 'Commitment not found') {
                    return c.json(createErrorResponse('E004', 'Commitment not found'), 404);
                }
                throw error; // Let global error handler handle it
            }
        };
    }
}
