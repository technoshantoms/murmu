import { validateProfile } from '$lib/api/profiles';
import { getDB } from '$lib/server/db';
import { createProfile, getProfilesByUserId } from '$lib/server/models/profiles';
import { getUserIdByPublicKey } from '$lib/server/models/public-key';
import type { ProfileInsert, ProfileObject } from '$lib/types/profile';
import { authenticateUcanRequest } from '$lib/utils/ucan-utils.server';
import type { D1Database } from '@cloudflare/workers-types';
import { createId } from '@paralleldrive/cuid2';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const { publicKey, error, status } = await authenticateUcanRequest(request, {
			scheme: 'api',
			hierPart: '/profiles',
			namespace: 'profiles',
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

		const profiles = await getProfilesByUserId(db, userByPublicKey.userId);

		return json({ data: profiles, success: true });
	} catch (err) {
		console.error(`Failed to fetch profiles: ${err}`);
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
			hierPart: '/profiles',
			namespace: 'profiles',
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

		const { linkedSchemas, title, profile, nodeId, lastUpdated } = await request.json();

		if (!linkedSchemas || !title || !profile || !nodeId || !lastUpdated) {
			return json({ error: 'Missing required fields', success: false }, { status: 400 });
		}

		// Validate profile
		const validationResult = await validateProfile(JSON.parse(profile) as ProfileObject);
		if (validationResult.errors) {
			return json({ errors: validationResult.errors, success: false }, { status: 422 });
		}

		const cuid = createId();
		const profileInsert: ProfileInsert = {
			cuid,
			userId: userByPublicKey.userId,
			lastUpdated,
			linkedSchemas,
			title,
			profile,
			nodeId
		};

		await createProfile(db, profileInsert);

		return json({ data: profileInsert, success: true }, { status: 201 });
	} catch (err) {
		console.error(`Profile save failed: ${err}`);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
