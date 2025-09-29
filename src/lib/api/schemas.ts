import { PUBLIC_LIBRARY_URL } from '$env/static/public';
import { request } from '$lib/api/request';
import type { BasicSchema } from '$lib/types/schema';
import type { JSONSchema7 } from 'json-schema';

export const getSchemas = (url: string, customFetch?: typeof fetch) =>
	request<undefined, { name: string }[]>(url, 'GET', undefined, customFetch, false);

export const getSchema = (clusterUuid: string, customFetch?: typeof fetch) =>
	request<undefined, JSONSchema7>(
		`/api/clusters/${clusterUuid}/schema`,
		'GET',
		undefined,
		customFetch
	);

export const getLibrarySchemas = (customFetch?: typeof fetch) =>
	request<undefined, BasicSchema[]>(
		`${PUBLIC_LIBRARY_URL}/v2/schemas`,
		'GET',
		undefined,
		customFetch,
		false
	);
