import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommitmentController } from '../../../src/modules/commitment/commitment.controller';
import { CommitmentService } from '../../../src/modules/commitment/services/commitment.service';
import type { Context } from 'hono';

// Mock Context Helper
function createMockContext(body: any = null, param: any = null) {
    let status = 200;
    return {
        req: {
            json: async () => body || {},
            param: (key: string) => param ? param[key] : undefined,
        },
        get: vi.fn().mockReturnValue('user-1'), // Mock userId from middleware
        json: vi.fn().mockImplementation((data, statusCode) => {
            status = statusCode || 200;
            return { data, status };
        }),
        status: (s: number) => { status = s; return { json: vi.fn() } },
    } as unknown as Context;
}

describe('CommitmentController', () => {
    let controller: CommitmentController;
    let mockCommitmentService: any;

    beforeEach(() => {
        mockCommitmentService = {
            create: vi.fn(),
            logCommitment: vi.fn(),
            getCommitments: vi.fn(),
            delete: vi.fn(),
        };
        controller = new CommitmentController(mockCommitmentService as unknown as CommitmentService);
    });

    describe('getCommitments', () => {
        it('should return commitments', async () => {
            const commitments = [{ id: 'c-1', title: 'Task' }];
            mockCommitmentService.getCommitments.mockResolvedValue(commitments);

            const ctx = createMockContext();
            await controller.getCommitments()(ctx);

            expect(mockCommitmentService.getCommitments).toHaveBeenCalledWith('user-1');
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S001',
                    data: commitments,
                })
            );
        });
    });

    describe('create', () => {
        it('should create a commitment', async () => {
            const input = { title: 'New Task', scheduledDays: ['mon'] };
            const created = { id: 'c-1', ...input };
            mockCommitmentService.create.mockResolvedValue(created);

            const ctx = createMockContext(input);
            await controller.create()(ctx);

            expect(mockCommitmentService.create).toHaveBeenCalledWith('user-1', input);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S002',
                    data: created,
                }),
                201
            );
        });
    });

    describe('logCommitment', () => {
        it('should log a commitment', async () => {
            const input = { note: 'Done' };
            const log = { id: 'l-1', ...input };
            mockCommitmentService.logCommitment.mockResolvedValue(log);

            const ctx = createMockContext(input, { id: 'c-1' });
            await controller.logCommitment()(ctx);

            expect(mockCommitmentService.logCommitment).toHaveBeenCalledWith('user-1', 'c-1', input);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S003',
                    data: log,
                }),
                201
            );
        });
    });
});
