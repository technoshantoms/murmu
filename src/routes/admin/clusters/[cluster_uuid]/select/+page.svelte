<script lang="ts">
	import { goto } from '$app/navigation';
	import { updateNodeStatus } from '$lib/api/nodes';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { Progress } from '$lib/components/ui/progress';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import type { Node } from '$lib/types/node';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';

	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let nodes: Node[] = $state(data?.nodes ?? []);
	let selectedIds: number[] = $state([]);
	let isSubmitting = $state(false);
	let loadingProgress = $state(0);

	const actions = [
		{ value: 'published', label: 'Publish' },
		{ value: 'dismissed', label: 'Dismiss' },
		{ value: 'ignored', label: 'Ignore' }
	];

	let selectedAction = $state('');

	const triggerContent = $derived(
		actions.find((a) => a.value === selectedAction)?.label ?? 'Select action'
	);

	const showUnavailableColumn = $derived(nodes.some((n) => !n.isAvailable && n.unavailableMessage));

	function toggleSelectAll() {
		const selectable = nodes.filter((n) => n.isAvailable && n.hasAuthority);
		if (selectedIds.length === selectable.length) {
			selectedIds = [];
		} else {
			selectedIds = selectable.map((n) => n.id);
		}
	}

	function toggleSelectRow(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!selectedAction || selectedIds.length === 0) {
			toast.error('Please select an action and at least one node.');
			return;
		}

		// Scroll to the top of the page
		window.scrollTo({ top: 0, behavior: 'smooth' });

		isSubmitting = true;
		loadingProgress = 0;

		try {
			const step = 100 / selectedIds.length;
			for (let i = 0; i < selectedIds.length; i++) {
				const { success, error } = await updateNodeStatus(
					data?.clusterUuid,
					selectedIds[i],
					selectedAction
				);

				if (!success) {
					toast.error(error ?? 'Failed to update node status');
					return;
				}

				loadingProgress = Math.min(100, Math.round(step * (i + 1)));
			}
			toast.success('Node statuses updated successfully.');

			await goto('/admin');
		} catch (error) {
			console.error('Error updating node statuses:', error);
			toast.error('Failed to update node statuses. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	onMount(() => {
		if (data?.nodes === null) {
			toast.error('Cluster not found. Please try again.');
			goto('/admin');
		}
	});
</script>

<div class="container mx-auto py-4">
	{#if isSubmitting}
		<div class="my-6">
			<p class="mb-2 text-sm text-muted-foreground">
				Updating nodes, please wait... {loadingProgress}%
			</p>
			<Progress value={loadingProgress} max={100} class="w-full" />
		</div>
	{/if}

	<h1 class="mb-4 text-2xl font-semibold">Select Nodes</h1>

	<p class="mb-6">
		Manage the nodes to display in your cluster. You can learn more
		<a href="https://docs.murmurations.network" class="text-primary hover:underline">in the docs</a
		>.
	</p>

	<div class="overflow-hidden rounded-md border">
		<div class="overflow-x-auto">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[40px]">
							<Checkbox
								checked={nodes.length > 0 &&
									selectedIds.length ===
										nodes.filter((r) => r.isAvailable && r.hasAuthority).length}
								onCheckedChange={toggleSelectAll}
							/>
						</Table.Head>
						<Table.Head class="w-[40px]">ID</Table.Head>
						<Table.Head class="w-[40px]">📍</Table.Head>
						<Table.Head>Name / Title</Table.Head>
						<Table.Head>Primary URL</Table.Head>
						<Table.Head>Profile URL</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Availability</Table.Head>
						{#if showUnavailableColumn}
							<Table.Head>Unavailable Message</Table.Head>
						{/if}
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{#each nodes as node (node.id)}
						<Table.Row class={node.hasUpdated ? 'bg-yellow-100 dark:bg-yellow-950' : ''}>
							<Table.Cell>
								<Checkbox
									checked={selectedIds.includes(node.id)}
									onCheckedChange={() => toggleSelectRow(node.id)}
									disabled={!node.isAvailable || !node.hasAuthority}
								/>
							</Table.Cell>
							<Table.Cell>{node.id}</Table.Cell>
							<Table.Cell>{JSON.parse(node.data)?.geolocation ? '📍' : ''}</Table.Cell>
							<Table.Cell>{JSON.parse(node.data)?.name || 'N/A'}</Table.Cell>
							<Table.Cell>{JSON.parse(node.data)?.primary_url || 'N/A'}</Table.Cell>
							<Table.Cell>
								<a
									href={node.profileUrl}
									target="_blank"
									rel="noreferrer"
									class="text-blue-500 underline">{node.profileUrl}</a
								>
							</Table.Cell>
							<Table.Cell class="capitalize">
								{node.status}
								{#if node.hasUpdated}
									<Badge class="ml-2" variant="outline">Updated</Badge>
								{/if}
							</Table.Cell>
							<Table.Cell class="capitalize">
								{node.isAvailable ? 'Available' : 'Unavailable'}
							</Table.Cell>
							{#if showUnavailableColumn}
								<Table.Cell class="text-red-600">
									{#if !node.isAvailable && node.unavailableMessage}
										{node.unavailableMessage}
									{/if}
								</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</div>

	<div class="mt-6 flex items-center gap-4">
		<div>
			<Select.Root type="single" name="action" bind:value={selectedAction}>
				<Select.Trigger class="w-32">
					{triggerContent}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Label>Actions</Label>
						{#each actions as action (action.value)}
							<Select.Item value={action.value} label={action.label}>
								{action.label}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</div>

		{#if isSubmitting}
			<Button disabled>
				<LoaderCircle class="animate-spin" />
				Please wait
			</Button>
		{:else}
			<Button variant="default" onclick={handleSubmit}>Submit</Button>
		{/if}
		<Button variant="outline" href="/admin">Cancel</Button>
	</div>

	<div class="mt-4 text-sm text-muted-foreground">
		<p>Publish = display node in cluster</p>
		<p>Dismiss = hide node until it has updates</p>
		<p>Ignore = always hide node</p>
	</div>
</div>
