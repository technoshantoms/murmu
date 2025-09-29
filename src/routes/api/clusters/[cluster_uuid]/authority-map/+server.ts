import { getDB } from '$lib/server/db';
import { getNodes } from '$lib/server/models/node';
import type { Node } from '$lib/types/node';
import type { D1Database } from '@cloudflare/workers-types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	params
}) => {
	try {
		const db = getDB(platform.env);
		const clusterUuid = params.cluster_uuid;

		if (!clusterUuid) {
			return json({ error: 'Missing cluster_uuid', success: false }, { status: 400 });
		}

		const nodes = await getNodes(db, clusterUuid);

		const primaryUrlMap: string[] = [];

		nodes.forEach((node: Node) => {
			const profileUrl = node.profileUrl;
			const data = JSON.parse(node.data);
			const primaryUrl = data.primary_url ?? '';

			// Parse URLs to get hostnames
			const profileHost = new URL(profileUrl).hostname;
			const primaryHost = primaryUrl ? new URL(primaryUrl).hostname : '';

			if (profileHost && primaryHost && profileHost === primaryHost) {
				primaryUrlMap.push(primaryHost);
			}
		});

		return json({ data: primaryUrlMap, success: true }, { status: 200 });
	} catch (error) {
		console.error('Error processing GET request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
