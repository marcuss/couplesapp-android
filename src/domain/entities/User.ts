/**
 * User Entity
 * Represents a user in the CouplePlan application
 */

import { Result } from '../../shared/utils/Result';
import { ValidationError } from '../errors/DomainError';

export const VALID_GENDERS = ['male', 'female', 'queer', 'non_binary', 'other'] as const;
export type Gender = typeof VALID_GENDERS[number];

export const VALID_RELATIONSHIP_TYPES = ['dating', 'engaged', 'married', 'committed', 'other'] as const;
export type RelationshipType = typeof VALID_RELATIONSHIP_TYPES[number];

export interface UserProps {
  id: string;
  email: string;
  name: string;
  partnerId?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  relationshipType?: RelationshipType;
  partnerName?: string;
  hasChildren?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  relationshipType?: RelationshipType;
  partnerName?: string;
  hasChildren?: boolean;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  /**
   * Create a new User with validation
   */
  static create(props: CreateUserProps): Result<User, ValidationError> {
    // Validate ID
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new ValidationError('User ID is required', 'id'));
    }

    // Validate email
    const emailValidation = this.validateEmail(props.email);
    if (emailValidation.isFail()) {
      return Result.fail(emailValidation.getError());
    }

    // Validate name
    const nameValidation = this.validateName(props.name);
    if (nameValidation.isFail()) {
      return Result.fail(nameValidation.getError());
    }

    // Validate date of birth (if provided)
    if (props.dateOfBirth !== undefined) {
      const dobValidation = this.validateDateOfBirth(props.dateOfBirth);
      if (dobValidation.isFail()) {
        return Result.fail(dobValidation.getError());
      }
    }

    // Validate gender (if provided)
    if (props.gender !== undefined && !VALID_GENDERS.includes(props.gender)) {
      return Result.fail(new ValidationError('Invalid gender value', 'gender'));
    }

    // Validate relationship type (if provided)
    if (props.relationshipType !== undefined && !VALID_RELATIONSHIP_TYPES.includes(props.relationshipType)) {
      return Result.fail(new ValidationError('Invalid relationship type', 'relationshipType'));
    }

    const now = new Date();
    const user = new User({
      ...props,
      partnerId: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(user);
  }

  /**
   * Reconstitute a User from persistence (no validation)
   */
  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  /**
   * Validate email format
   */
  private static validateEmail(email: string): Result<void, ValidationError> {
    if (!email || email.trim().length === 0) {
      return Result.fail(new ValidationError('Email is required', 'email'));
    }

    // RFC 5322 compliant regex (simplified)
    const emailRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return Result.fail(new ValidationError('Invalid email format', 'email'));
    }

    return Result.ok(undefined);
  }

  /**
   * Validate date of birth
   */
  private static validateDateOfBirth(dateOfBirth: Date): Result<void, ValidationError> {
    const now = new Date();
    if (dateOfBirth >= now) {
      return Result.fail(new ValidationError('Date of birth must be in the past', 'dateOfBirth'));
    }

    const ageDiffMs = now.getTime() - dateOfBirth.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 13) {
      return Result.fail(new ValidationError('User must be at least 13 years old', 'dateOfBirth'));
    }

    return Result.ok(undefined);
  }

  /**
   * Validate name
   */
  private static validateName(name: string): Result<void, ValidationError> {
    if (!name || name.trim().length === 0) {
      return Result.fail(new ValidationError('Name is required', 'name'));
    }

    if (name.trim().length < 2) {
      return Result.fail(new ValidationError('Name must be at least 2 characters', 'name'));
    }

    if (name.trim().length > 50) {
      return Result.fail(new ValidationError('Name must be at most 50 characters', 'name'));
    }

    return Result.ok(undefined);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get partnerId(): string | undefined {
    return this.props.partnerId;
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  get dateOfBirth(): Date | undefined {
    return this.props.dateOfBirth;
  }

  get gender(): Gender | undefined {
    return this.props.gender;
  }

  get relationshipType(): RelationshipType | undefined {
    return this.props.relationshipType;
  }

  get partnerName(): string | undefined {
    return this.props.partnerName;
  }

  get hasChildren(): boolean | undefined {
    return this.props.hasChildren;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get hasPartner(): boolean {
    return this.props.partnerId !== undefined && this.props.partnerId !== null;
  }

  // Domain methods

  /**
   * Connect with a partner
   */
  connectPartner(partnerId: string): Result<User, ValidationError> {
    if (!partnerId || partnerId.trim().length === 0) {
      return Result.fail(new ValidationError('Partner ID is required', 'partnerId'));
    }

    if (this.props.partnerId === partnerId) {
      return Result.fail(new ValidationError('Cannot connect to yourself', 'partnerId'));
    }

    if (this.props.partnerId) {
      return Result.fail(new ValidationError('User already has a partner', 'partnerId'));
    }

    const updatedUser = new User({
      ...this.props,
      partnerId,
      updatedAt: new Date(),
    });

    return Result.ok(updatedUser);
  }

  /**
   * Disconnect from partner
   */
  disconnectPartner(): Result<User, ValidationError> {
    if (!this.props.partnerId) {
      return Result.fail(new ValidationError('User does not have a partner', 'partnerId'));
    }

    const updatedUser = new User({
      ...this.props,
      partnerId: undefined,
      updatedAt: new Date(),
    });

    return Result.ok(updatedUser);
  }

  /**
   * Update user profile
   */
  updateProfile(updates: { name?: string; avatarUrl?: string }): Result<User, ValidationError> {
    if (updates.name !== undefined) {
      const nameValidation = User.validateName(updates.name);
      if (nameValidation.isFail()) {
        return Result.fail(nameValidation.getError());
      }
    }

    const updatedUser = new User({
      ...this.props,
      name: updates.name ?? this.props.name,
      avatarUrl: updates.avatarUrl ?? this.props.avatarUrl,
      updatedAt: new Date(),
    });

    return Result.ok(updatedUser);
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): UserProps {
    return { ...this.props };
  }

  /**
   * Check equality
   */
  equals(other: User): boolean {
    return this.props.id === other.props.id;
  }
}
