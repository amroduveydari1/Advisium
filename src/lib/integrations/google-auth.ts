type GoogleScopeTarget = "analytics" | "ads";

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function requiredEnvConfigured(): boolean {
	return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function getRedirectUri(): string {
	return process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
}

function getScopes(target: GoogleScopeTarget): string[] {
	if (target === "analytics") {
		return [
			"openid",
			"email",
			"profile",
			"https://www.googleapis.com/auth/analytics.readonly",
		];
	}

	return [
		"openid",
		"email",
		"profile",
		"https://www.googleapis.com/auth/adwords",
	];
}

export function isDemoMode(): boolean {
	if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
	return !requiredEnvConfigured();
}

export function getAuthUrl(target: GoogleScopeTarget): string {
	if (!process.env.GOOGLE_CLIENT_ID) {
		throw new Error("GOOGLE_CLIENT_ID is missing");
	}

	const params = new URLSearchParams({
		client_id: process.env.GOOGLE_CLIENT_ID,
		redirect_uri: getRedirectUri(),
		response_type: "code",
		access_type: "offline",
		include_granted_scopes: "true",
		prompt: "consent",
		scope: getScopes(target).join(" "),
		state: target,
	});

	return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export interface GoogleTokenResponse {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
	scope: string;
	token_type: string;
	id_token?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error("Google OAuth credentials are missing");
	}

	const params = new URLSearchParams({
		code,
		client_id: clientId,
		client_secret: clientSecret,
		redirect_uri: getRedirectUri(),
		grant_type: "authorization_code",
	});

	const response = await fetch(GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	if (!response.ok) {
		throw new Error(`Google token exchange failed with status ${response.status}`);
	}

	const json = (await response.json()) as GoogleTokenResponse;
	return json;
}
