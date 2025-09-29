import { getNodes } from '$lib/api/nodes';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
	const clusterUuid = params.cluster_uuid;

	try {
		const { data: nodes } = await getNodes(clusterUuid, fetch);

		return {
			title: 'Select Nodes',
			clusterUuid,
			nodes
		};
	} catch (err) {
		console.error('Error loading nodes:', err);
		return {
			title: 'Select Nodes',
			clusterUuid,
			nodes: null
		};
	}
};
