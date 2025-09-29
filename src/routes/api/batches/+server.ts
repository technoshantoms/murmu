import { PUBLIC_DATA_PROXY_URL } from '$env/static/public';
import { getDB } from '$lib/server/db';
import { getUserIdByPublicKey } from '$lib/server/models/public-key';
import { authenticateUcanRequest } from '$lib/utils/ucan-utils.server';
import type { D1Database } from '@cloudflare/workers-types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const { publicKey, error, status } = await authenticateUcanRequest(request, {
			scheme: 'api',
			hierPart: '/batches',
			namespace: 'batches',
			segments: ['GET']
		});

		if (!publicKey) {
			return json({ error, success: false }, { status });
		}

		const db = getDB(platform.env);

		const userByPublicKey = await getUserIdByPublicKey(db, publicKey);

		if (!userByPublicKey) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		// todo: use last 25 characters of public key as cuid
		const cuid = publicKey.slice(-25);

		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/user?user_id=${cuid}`);

		if (!response.ok) {
			return json(
				{ error: 'Failed to fetch batches data', success: false },
				{ status: response.status }
			);
		}

		const data = await response.json();

		return json({ data: data?.data, success: true });
	} catch (err) {
		console.error(`Error occurred while fetching data: ${err}`);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const { publicKey, error, status } = await authenticateUcanRequest(request, {
			scheme: 'api',
			hierPart: '/batches',
			namespace: 'batches',
			segments: ['POST']
		});

		if (!publicKey) {
			return json({ error, success: false }, { status });
		}

		const db = getDB(platform.env);
		const userByPublicKey = await getUserIdByPublicKey(db, publicKey);

		if (!userByPublicKey) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		const formData = await request.formData();
		const file = formData.get('file');
		const schemas = formData.get('schemas');
		const title = formData.get('title');
		const cuid = publicKey.slice(-25);

		formData.append('user_id', cuid);
		formData.append('schemas', '[' + schemas + ']');

		if (!file || !schemas || !title || !cuid) {
			return json({ error: 'Missing required fields', success: false }, { status: 400 });
		}

		// Validate the batch import data
		const validationResponse = await validateBatchImport(formData);

		if (validationResponse.status !== 200) {
			return validationResponse;
		}

		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/import`, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const res = await response.json();
			if (res.errors) {
				return json({ errors: res.errors, success: false }, { status: response.status });
			}
			return json({ error: 'Failed to import batch', success: false }, { status: response.status });
		}

		const { data, meta } = await response.json();
		return json({ data, meta, success: true });
	} catch (err) {
		console.error(`Error occurred while importing batch: ${err}`);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const { publicKey, error, status } = await authenticateUcanRequest(request, {
			scheme: 'api',
			hierPart: '/batches',
			namespace: 'batches',
			segments: ['PUT']
		});

		if (!publicKey) {
			return json({ error, success: false }, { status });
		}

		const db = getDB(platform.env);
		const userByPublicKey = await getUserIdByPublicKey(db, publicKey);

		if (!userByPublicKey) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		const formData = await request.formData();
		const file = formData.get('file');
		const schemas = formData.get('schemas');
		const title = formData.get('title');
		const batchId = formData.get('batch_id');
		const cuid = publicKey.slice(-25);

		formData.append('user_id', cuid);
		formData.append('schemas', '[' + schemas + ']');

		if (!file || !schemas || !title || !batchId || !cuid) {
			return json({ error: 'Missing required fields', success: false }, { status: 400 });
		}

		// Validate the batch import data
		const validationResponse = await validateBatchImport(formData);

		if (validationResponse.status !== 200) {
			return validationResponse;
		}

		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/import`, {
			method: 'PUT',
			body: formData
		});

		if (!response.ok) {
			const res = await response.json();
			if (res.errors) {
				return json({ errors: res.errors, success: false }, { status: response.status });
			}
			return json({ error: 'Failed to update batch', success: false }, { status: response.status });
		}

		const { data, meta } = await response.json();
		return json({ data, meta, success: true });
	} catch (err) {
		console.error(`Error occurred while updating batch: ${err}`);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const { publicKey, error, status } = await authenticateUcanRequest(request, {
			scheme: 'api',
			hierPart: '/batches',
			namespace: 'batches',
			segments: ['DELETE']
		});

		if (!publicKey) {
			return json({ error, success: false }, { status });
		}

		const db = getDB(platform.env);
		const userByPublicKey = await getUserIdByPublicKey(db, publicKey);

		if (!userByPublicKey) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		const formData = await request.formData();
		const batchId = formData.get('batch_id');
		const cuid = publicKey.slice(-25);

		formData.append('user_id', cuid);

		if (!batchId || !cuid) {
			return json({ error: 'Missing batch_id or user_id', success: false }, { status: 400 });
		}

		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/import`, {
			method: 'DELETE',
			body: formData
		});

		if (!response.ok) {
			const res = await response.json();
			return json(
				{ error: res.message || 'Failed to delete batch', success: false },
				{ status: response.status }
			);
		}

		return json({ message: 'Batch deleted successfully', success: true });
	} catch (err) {
		console.error(`Error occurred while deleting batch: ${err}`);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};

const validateBatchImport = async (formData: FormData): Promise<Response> => {
	try {
		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/validate`, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const res = await response.json();
			if (res.errors) {
				return json({ errors: res.errors, success: false }, { status: response.status });
			}
			return json(
				{ error: 'Failed to validate batch', success: false },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json({ data, success: true });
	} catch (err) {
		console.error(`Error occurred while validating batch: ${err}`);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
