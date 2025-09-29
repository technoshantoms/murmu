import { getCluster } from '$lib/api/clusters';
import { getNodes } from '$lib/api/nodes';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
	const clusterUuid = params.cluster_uuid;

	const { data: cluster } = await getCluster(clusterUuid, fetch);
	const { data: nodes } = await getNodes(clusterUuid, fetch);

	return {
		title: 'Update Nodes',
		cluster,
		nodes
	};
};
