/**
 * Register Use Case
 * Handles user registration
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, ConflictError, ValidationError } from '../../../domain/errors/DomainError';
import { User, VALID_GENDERS, VALID_RELATIONSHIP_TYPES, Gender, RelationshipType } from '../../../domain/entities/User';
import { Password } from '../../../domain/value-objects/Password';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { RegisterDTO, RegisterResult } from '../../dto/RegisterDTO';

export interface IAuthServiceRegister {
  signUp(email: string, password: string): AsyncResult<{
    user: { id: string; email: string };
    session: { accessToken: string; refreshToken: string; expiresAt: number } | null;
  }, Error>;
}

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: IAuthServiceRegister
  ) {}

  async execute(dto: RegisterDTO): AsyncResult<RegisterResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Check if email already exists
    const existsResult = await this.userRepository.existsByEmail(dto.email);
    if (existsResult.isFail()) {
      return Result.fail(existsResult.getError());
    }

    if (existsResult.getValue()) {
      return Result.fail(new ConflictError('Email already registered'));
    }

    // Register with auth service
    const authResult = await this.authService.signUp(dto.email, dto.password);
    if (authResult.isFail()) {
      return Result.fail(new ConflictError(authResult.getError().message));
    }

    const authData = authResult.getValue();

    // Create user entity
    const userResult = User.create({
      id: authData.user.id,
      email: dto.email,
      name: dto.name,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      gender: dto.gender as Gender | undefined,
      relationshipType: dto.relationshipType as RelationshipType | undefined,
      partnerName: dto.partnerName,
      hasChildren: dto.hasChildren,
    });

    if (userResult.isFail()) {
      return Result.fail(userResult.getError());
    }

    const user = userResult.getValue();

    // Save user to repository
    const saveResult = await this.userRepository.save(user);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    // Return registration result
    return Result.ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      session: authData.session || {
        accessToken: '',
        refreshToken: '',
        expiresAt: 0,
      },
    });
  }

  private validateInput(dto: RegisterDTO): ValidationError | null {
    if (!dto.email || dto.email.trim().length === 0) {
      return new ValidationError('Email is required', 'email');
    }

    const emailRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(dto.email)) {
      return new ValidationError('Invalid email format', 'email');
    }

    // Validate password using the Password Value Object (fail fast in domain)
    const passwordResult = Password.create(dto.password ?? '');
    if (passwordResult.isFail()) {
      return passwordResult.getError();
    }

    if (!dto.name || dto.name.trim().length === 0) {
      return new ValidationError('Name is required', 'name');
    }

    if (dto.name.trim().length < 2) {
      return new ValidationError('Name must be at least 2 characters', 'name');
    }

    if (dto.name.trim().length > 50) {
      return new ValidationError('Name must be at most 50 characters', 'name');
    }

    // Validate date of birth
    if (dto.dateOfBirth) {
      const dob = new Date(dto.dateOfBirth);
      if (isNaN(dob.getTime())) {
        return new ValidationError('Invalid date of birth format', 'dateOfBirth');
      }

      const now = new Date();
      if (dob >= now) {
        return new ValidationError('Date of birth must be in the past', 'dateOfBirth');
      }

      const ageDiffMs = now.getTime() - dob.getTime();
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 13) {
        return new ValidationError('User must be at least 13 years old', 'dateOfBirth');
      }
    }

    // Validate gender
    if (dto.gender && !VALID_GENDERS.includes(dto.gender as Gender)) {
      return new ValidationError('Invalid gender value', 'gender');
    }

    // Validate relationship type
    if (dto.relationshipType && !VALID_RELATIONSHIP_TYPES.includes(dto.relationshipType as RelationshipType)) {
      return new ValidationError('Invalid relationship type', 'relationshipType');
    }

    return null;
  }
}
