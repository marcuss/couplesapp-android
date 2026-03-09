/**
 * Register DTO (Data Transfer Object)
 */

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  dateOfBirth: string;
  gender?: string;
  relationshipType?: string;
  partnerName?: string;
  hasChildren?: boolean;
}

export interface RegisterResult {
  user: {
    id: string;
    email: string;
    name: string;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}
