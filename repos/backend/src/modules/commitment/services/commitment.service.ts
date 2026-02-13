import { Commitment } from '@prisma/client';
import { Container, resolveService } from '../../../shared/container';
import { CommitmentRepository } from '../repositories/commitment.repository';
import { CommitmentLogRepository } from '../repositories/commitment-log.repository';

export interface CreateCommitmentRequest {
    title: string;
    scheduledDays: string[];
}

export interface LogCommitmentRequest {
    note?: string;
}

export class CommitmentService {
    private commitmentRepository: CommitmentRepository;
    private commitmentLogRepository: CommitmentLogRepository;

    constructor(container: Container) {
        this.commitmentRepository = resolveService<CommitmentRepository>('CommitmentRepository', container);
        this.commitmentLogRepository = resolveService<CommitmentLogRepository>('CommitmentLogRepository', container);
    }

    async create(userId: string, data: CreateCommitmentRequest): Promise<Commitment> {
        const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        if (!data.scheduledDays.every(day => validDays.includes(day.toLowerCase()))) {
            throw new Error('Invalid scheduled days');
        }

        return this.commitmentRepository.create({
            userId,
            title: data.title,
            scheduledDays: data.scheduledDays.map(d => d.toLowerCase()),
        });
    }

    async logCommitment(userId: string, commitmentId: string, data: LogCommitmentRequest) {
        const commitment = await this.commitmentRepository.findById(commitmentId);
        if (!commitment || commitment.userId !== userId) {
            throw new Error('Commitment not found');
        }

        return this.commitmentLogRepository.create({
            commitmentId,
            note: data.note,
            completedAt: new Date(),
        });
    }

    async getCommitments(userId: string) {
        const commitments = await this.commitmentRepository.findByUserId(userId);
        const today = new Date();

        const result = await Promise.all(commitments.map(async (commitment) => {
            const count = await this.commitmentLogRepository.countByCommitmentIdAndDate(commitment.id, today);
            return {
                ...commitment,
                completedToday: count > 0,
            };
        }));

        return result;
    }

    async delete(userId: string, commitmentId: string) {
        const commitment = await this.commitmentRepository.findById(commitmentId);
        if (!commitment || commitment.userId !== userId) {
            throw new Error('Commitment not found');
        }
        return this.commitmentRepository.delete(commitmentId);
    }
}
