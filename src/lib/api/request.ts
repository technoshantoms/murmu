import { getToken } from '$lib/core';
import { currentTokenStore } from '$lib/stores/token-store';
import type { Meta } from '$lib/types/api';
import type { IndexNodeMeta } from '$lib/types/index-node';
import type { ValidationError } from '$lib/types/profile';
import { compressTokenBrotli } from '$lib/utils/compress-token';

import { get } from 'svelte/store';

export async function request<TBody, TResponse>(
	url: string,
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	body?: TBody,
	customFetch: typeof fetch = fetch,
	withCredentials: boolean = true
): Promise<{
	data: TResponse;
	success: boolean;
	message?: string;
	error?: string;
	meta?: Meta | IndexNodeMeta;
	errors?: ValidationError[];
}> {
	let currentToken = get(currentTokenStore);
	if (!currentToken) {
		currentToken = await getToken('currentToken');
	}

	if (currentToken) {
		const compressedToken = compressTokenBrotli(currentToken);
		currentToken = compressedToken;
	}

	try {
		const headers: HeadersInit = {
			'Content-Type': 'application/json'
		};

		if (currentToken) {
			headers['Authorization'] = `Bearer ${currentToken}`;
		}

		const requestBody = body !== undefined ? JSON.stringify(body) : undefined;

		const response = await customFetch(url, {
			method,
			headers,
			body: requestBody,
			credentials: withCredentials ? 'include' : 'omit'
		});

		const json = await response.json();

		if (!response.ok) {
			return {
				data: null as unknown as TResponse,
				success: false,
				message: json?.message,
				error: json?.error,
				meta: json?.meta,
				errors: json?.errors
			};
		}

		return json;
	} catch (error) {
		console.error(`Error on request to ${url}:`, error);
		throw error;
	}
}

export async function requestRaw<TResponse>(
	url: string,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
	customFetch: typeof fetch = fetch
): Promise<{
	data: TResponse;
	success: boolean;
}> {
	try {
		const response = await customFetch(url, {
			method
		});

		if (!response.ok) {
			throw new Error(`Request failed with status ${response.status}`);
		}

		const json = (await response.json()) as TResponse;

		return {
			data: json,
			success: true
		};
	} catch (error) {
		console.error(`Error on requestRaw to ${url}:`, error);
		throw error;
	}
}

export async function requestWithFormData<TResponse>(
	url: string,
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	body?: FormData,
	customFetch: typeof fetch = fetch
): Promise<{
	data: TResponse;
	success: boolean;
	message?: string;
	error?: string;
	meta?: Meta;
	errors?: ValidationError[];
}> {
	let currentToken = get(currentTokenStore);
	if (!currentToken) {
		currentToken = await getToken('currentToken');
	}

	if (currentToken) {
		const compressedToken = compressTokenBrotli(currentToken);
		currentToken = compressedToken;
	}

	try {
		const headers: HeadersInit = {};

		if (currentToken) {
			headers['Authorization'] = `Bearer ${currentToken}`;
		}

		const response = await customFetch(url, {
			method,
			headers,
			body
		});

		const json = await response.json();

		if (!response.ok) {
			return {
				data: null as unknown as TResponse,
				success: false,
				message: json?.message,
				error: json?.error,
				meta: json?.meta,
				errors: json?.errors
			};
		}

		return json;
	} catch (error) {
		console.error(`Error on request to ${url}:`, error);
		throw error;
	}
}
