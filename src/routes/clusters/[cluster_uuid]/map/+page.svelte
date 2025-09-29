<script lang="ts">
	import { goto } from '$app/navigation';
	import { getPublishedMapNodes } from '$lib/api/nodes';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Map, MarkerCluster, TileLayer } from '$lib/svelte-leaflet';
	import type { ClusterPublic } from '$lib/types/cluster';
	import type { DropdownField } from '$lib/types/enum-dropdown';
	import type { MapNode } from '$lib/types/node';
	import { AlertCircle, ArrowLeft, Search, Tag } from '@lucide/svelte';
	import L, { MarkerClusterGroup } from 'leaflet';

	import { untrack } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let nodes: MapNode[] = $state(data?.nodes ?? []);
	let cluster: ClusterPublic = $state(data?.cluster);
	let nameSearch: string = $state(data?.nameSearch ?? '');
	let tagSearch: string = $state(data?.tagSearch ?? '');
	let enumsDropdown: DropdownField[] = $state(data?.enumsDropdown ?? []);
	let enumFilters: Record<string, string> = $state(data?.enumFilters ?? {});
	let clusterInstance: MarkerClusterGroup | undefined = $state();

	function getDropdownTriggerContent(dropdown: DropdownField, fieldName: string) {
		const selectedValue = enumFilters[fieldName];
		if (!selectedValue) {
			return `All ${dropdown.title}`;
		}
		const selectedOption = dropdown.options.find((opt) => opt.value === selectedValue);
		return selectedOption?.label ?? `All ${dropdown.title}`;
	}

	function createPopupContent(node: MapNode): string {
		let content = `<div class="min-w-[200px] font-sans break-words">`;

		if (node.primaryUrl && node.primaryUrl.trim()) {
			content += `<div class="mb-2">
			<strong>URL:</strong>
			<a href="${node.primaryUrl}" target="_blank" rel="noopener noreferrer" 
			   class="text-blue-700 underline break-words">
				${node.primaryUrl}
			</a>
		</div>`;
		}

		if (node.id) {
			content += `<div class="mb-2">
			<strong>Source:</strong>
			<a href="/clusters/${cluster.clusterUuid}/nodes/${node.id}" target="_blank" rel="noopener noreferrer" 
			   class="text-blue-700 underline break-words">
				Click to view node details
			</a>
		</div>`;
		}

		content += `</div>`;
		return content;
	}

	$effect(() => {
		untrack(() => {
			reloadData();
		});
	});

	async function reloadData() {
		const query = new SvelteURLSearchParams();
		if (nameSearch) query.set('name', nameSearch);
		if (tagSearch) query.set('tags', tagSearch);

		// Add enumFilters to query parameters if not empty
		for (const [key, value] of Object.entries(enumFilters)) {
			if (value) {
				query.set(key, value);
			}
		}

		goto(`?${query.toString()}`, { replaceState: true, noScroll: true });

		if (cluster?.clusterUuid) {
			const { data: mapNodes } = await getPublishedMapNodes(
				cluster.clusterUuid,
				nameSearch,
				tagSearch,
				enumFilters,
				fetch
			);
			nodes = mapNodes;

			// Clear + Add markers manually
			if (clusterInstance) {
				clusterInstance.clearLayers();

				mapNodes?.forEach((node) => {
					const marker = L.marker([node.lat, node.lon], {
						title: String(node.id)
					}).bindPopup(createPopupContent(node));
					clusterInstance?.addLayer(marker);
				});
			}
		}
	}

	function clearFilters() {
		nameSearch = '';
		tagSearch = '';
		enumFilters = {};
		reloadData();
	}

	function hasActiveFilters() {
		return nameSearch.trim() || tagSearch.trim() || Object.values(enumFilters).some((v) => v);
	}
</script>

<div class="container mx-auto">
	{#if !cluster}
		<div class="flex h-32 items-center justify-center">
			<div class="text-center space-y-2">
				<AlertCircle class="h-8 w-8 text-muted-foreground mx-auto" />
				<h3 class="text-lg font-semibold">Cluster Not Found</h3>
				<p class="text-sm text-muted-foreground">The requested cluster could not be loaded.</p>
			</div>
		</div>
	{:else}
		<div class="space-y-6">
			<Button variant="outline" size="sm" href="/">
				<ArrowLeft class="h-4 w-4" />
				Back to Home
			</Button>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<h1 class="text-3xl font-bold tracking-tight">{cluster.name} - Map View</h1>
				</div>
			</div>

			<Card>
				<CardContent class="p-6">
					<form
						onsubmit={(e) => {
							e.preventDefault();
							reloadData();
						}}
						class="space-y-4"
					>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="relative">
								<Search
									class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									id="nameSearch"
									placeholder="Search by name..."
									class="pl-10"
									bind:value={nameSearch}
								/>
							</div>
							<div class="relative">
								<Tag
									class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									id="tagSearch"
									placeholder="Search by tags (comma separated)..."
									class="pl-10"
									bind:value={tagSearch}
								/>
							</div>
						</div>

						{#if enumsDropdown && enumsDropdown.length > 0}
							<div class="space-y-3">
								<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
									{#each enumsDropdown as dropdown (dropdown.field_name)}
										<Select.Root type="single" bind:value={enumFilters[dropdown.field_name]}>
											<Select.Trigger class="w-full">
												{getDropdownTriggerContent(dropdown, dropdown.field_name)}
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="">All {dropdown.title}</Select.Item>
												{#each dropdown.options as opt (opt.value)}
													<Select.Item value={opt.value}>{opt.label}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									{/each}
								</div>
							</div>
						{/if}

						<div class="flex gap-2">
							<Button type="submit" class="flex-shrink-0">
								<Search class="h-4 w-4 mr-2" />
								Search
							</Button>
							{#if hasActiveFilters()}
								<Button type="button" variant="outline" onclick={clearFilters}>Clear Filters</Button
								>
							{/if}
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				{#if nodes?.length && nodes.length > 0}
					<CardContent class="p-0">
						<div class="relative z-0 w-full h-[700px]">
							<Map
								options={{
									center: [cluster?.centerLat ?? 46.603354, cluster?.centerLon ?? 1.888334],
									zoom: cluster?.scale ?? 6
								}}
							>
								<TileLayer url={'https://tile.openstreetmap.org/{z}/{x}/{y}.png'} />
								<MarkerCluster bind:instance={clusterInstance} />
							</Map>
						</div>
					</CardContent>
				{/if}
			</Card>

			{#if !nodes?.length || nodes.length === 0}
				<Card>
					<CardContent class="flex h-32 items-center justify-center">
						<div class="text-center space-y-2">
							<AlertCircle class="h-8 w-8 text-muted-foreground mx-auto" />
							<h3 class="text-lg font-semibold">
								{nameSearch.trim() || tagSearch.trim()
									? 'No Results Found'
									: 'No Map Data Available'}
							</h3>
							<p class="text-sm text-muted-foreground">
								{nameSearch.trim() || tagSearch.trim()
									? 'Try adjusting your search terms.'
									: "This cluster doesn't contain any nodes with location data yet."}
							</p>
						</div>
					</CardContent>
				</Card>
			{:else}
				<Card>
					<CardContent class="p-6">
						<p class="text-sm text-muted-foreground">
							Showing {nodes.length} node{nodes.length === 1 ? '' : 's'} with location data
						</p>
					</CardContent>
				</Card>
			{/if}
		</div>
	{/if}
</div>
