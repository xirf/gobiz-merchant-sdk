export interface OAuthTokenRequest {
  grant_type: 'client_credentials';
  scope: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface CachedToken {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  scope: string;
}
