import { request } from '$lib/api/request';
import type { MapNode, Node, NodeCreateInput, NodeUpdateInput } from '$lib/types/node';

export const createNode = (
	clusterUuid: string,
	input: NodeCreateInput,
	customFetch?: typeof fetch
) =>
	request<NodeCreateInput, Node>(`/api/clusters/${clusterUuid}/nodes`, 'POST', input, customFetch);

export const updateNode = (
	clusterUuid: string,
	nodeId: number,
	input: NodeUpdateInput,
	customFetch?: typeof fetch
) =>
	request<NodeUpdateInput, Node>(
		`/api/clusters/${clusterUuid}/nodes/${nodeId}`,
		'PUT',
		input,
		customFetch
	);

export const getNodes = (clusterUuid: string, customFetch?: typeof fetch) =>
	request<undefined, Node[]>(`/api/clusters/${clusterUuid}/nodes`, 'GET', undefined, customFetch);

export const getPublishedNodes = (
	clusterUuid: string,
	page: number,
	nameSearch: string,
	tagsSearch: string,
	sort: 'name-asc' | 'name-desc' | 'default',
	enumFilters: Record<string, string>,
	customFetch?: typeof fetch
) =>
	request<undefined, Node[]>(
		`/api/clusters/${clusterUuid}/published-nodes?page=${page}&name=${nameSearch}&tags=${tagsSearch}&sort=${sort}&${new URLSearchParams(enumFilters).toString()}`,
		'GET',
		undefined,
		customFetch
	);

export const getPublishedMapNodes = (
	clusterUuid: string,
	nameSearch: string,
	tagsSearch: string,
	enumFilters: Record<string, string>,
	customFetch?: typeof fetch
) =>
	request<undefined, MapNode[]>(
		`/api/clusters/${clusterUuid}/map-nodes?name=${nameSearch}&tags=${tagsSearch}&${new URLSearchParams(enumFilters).toString()}`,
		'GET',
		undefined,
		customFetch
	);

export const getPublishedNode = (clusterUuid: string, nodeId: string, customFetch?: typeof fetch) =>
	request<undefined, Node>(
		`/api/clusters/${clusterUuid}/nodes/${nodeId}`,
		'GET',
		undefined,
		customFetch
	);

export const updateNodeStatus = (
	clusterUuid: string,
	nodeId: number,
	status: string,
	customFetch?: typeof fetch
) =>
	request<{ status: string }, Node>(
		`/api/clusters/${clusterUuid}/nodes/${nodeId}/status`,
		'PUT',
		{ status },
		customFetch
	);

export const deleteNode = (clusterUuid: string, nodeId: number, customFetch?: typeof fetch) =>
	request<undefined, undefined>(
		`/api/clusters/${clusterUuid}/nodes/${nodeId}`,
		'DELETE',
		undefined,
		customFetch
	);
