import { getDB } from '$lib/server/db';
import { getNodeById, updateNodeStatus } from '$lib/server/models/node';
import { authenticateUcanRequest } from '$lib/utils/ucan-utils.server';
import type { D1Database } from '@cloudflare/workers-types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	params,
	request
}) => {
	try {
		const db = getDB(platform.env);

		const {
			publicKey,
			error,
			status: ucanStatus
		} = await authenticateUcanRequest(db, request, {
			scheme: 'api',
			hierPart: '/clusters/*/nodes/*/status',
			namespace: 'clusters',
			segments: ['PUT']
		});

		if (!publicKey) {
			return json({ error, success: false }, { status: ucanStatus });
		}

		const clusterUuid = params.cluster_uuid;
		const nodeId = params.node_id;
		const { status } = await request.json();

		// Validate input
		if (!clusterUuid || !nodeId) {
			return json({ error: 'Missing cluster_uuid or node_id', success: false }, { status: 400 });
		}

		if (!Number.isInteger(parseInt(nodeId))) {
			return json({ error: 'Invalid node_id', success: false }, { status: 400 });
		}

		if (!status) {
			return json({ error: 'Missing status', success: false }, { status: 400 });
		}

		const existingNode = await getNodeById(db, clusterUuid, parseInt(nodeId));

		if (!existingNode) {
			return json({ error: 'Node not found', success: false }, { status: 404 });
		}

		let result;
		if (existingNode[0].hasUpdated) {
			result = await updateNodeStatus(
				db,
				clusterUuid,
				parseInt(nodeId),
				status,
				existingNode[0].updatedData,
				true
			);
		} else {
			result = await updateNodeStatus(db, clusterUuid, parseInt(nodeId), status, null, false);
		}

		if (!result) {
			return json({ error: 'Failed to update node status', success: false }, { status: 500 });
		}

		return json({ data: null, success: true }, { status: 200 });
	} catch (error) {
		console.error('Error processing PUT request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
