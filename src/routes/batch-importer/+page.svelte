<script lang="ts">
	import { createBatch, deleteBatch, getBatches, updateBatch } from '$lib/api/batches';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { dbStatus } from '$lib/stores/db-status';
	import type { Batch } from '$lib/types/batch';
	import type { ValidationError } from '$lib/types/profile';
	import type { BasicSchema } from '$lib/types/schema';
	import { Database, Edit, Hash, Trash2 } from '@lucide/svelte';

	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import SchemaSelector from '../profile-generator/SchemaSelector.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const user = data?.user ?? null;

	let title = $state('');
	let file: FileList | undefined = $state(undefined);
	let batchCards: Batch[] = $state([]);
	let schemasSelected: string[] = $state([]);
	let errorsMessage: string[] | null = $state(null);
	let isLoading = $state(false);
	let isModifyMode = $state(false);
	let currentBatchId: string | null = null;
	let isDbOnline = $state(true);
	let dialogOpen: boolean = $state(false);

	// Subscribe to dbStatus changes
	dbStatus.subscribe((value) => (isDbOnline = value));

	onMount(async () => {
		if (data.errorMessage) {
			toast.error(data.errorMessage);
		}

		if (user) {
			await fetchBatches();
		}
	});

	async function handleImportOrModify(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		try {
			isLoading = true;
			if (!file || !title || schemasSelected.length === 0) {
				toast.error('Title, file, and at least one schema are required');
				return;
			}

			if (file[0].type !== 'text/csv') {
				toast.error('Only CSV files are allowed');
				return;
			}

			const formData = new FormData();
			formData.append('file', file[0]);
			formData.append('schemas', JSON.stringify(schemasSelected));
			formData.append('title', title);

			let success: boolean;
			let errors: ValidationError[] | null;
			let errorMessage: string | null;
			if (isModifyMode && currentBatchId) {
				formData.append('batch_id', currentBatchId);
				const {
					success: updateSuccess,
					errors: updateErrors,
					error: updateErrorMessage
				} = await updateBatch(formData);
				success = updateSuccess;
				errors = updateErrors ?? null;
				errorMessage = updateErrorMessage ?? '';
			} else {
				const {
					success: createSuccess,
					errors: createErrors,
					error: createErrorMessage
				} = await createBatch(formData);
				success = createSuccess;
				errors = createErrors ?? null;
				errorMessage = createErrorMessage ?? '';
			}

			if (!success) {
				if (errors) {
					errorsMessage = errors.map((error: ValidationError) => {
						const errorDetails = [];
						if (error.source?.oid !== undefined) errorDetails.push(`OID: ${error.source.oid}`);
						if (error.source?.pointer !== undefined)
							errorDetails.push(`Pointer: ${error.source.pointer}`);
						if (error.title !== undefined) errorDetails.push(`Title: ${error.title}`);
						if (error.detail !== undefined) errorDetails.push(`Detail: ${error.detail}`);
						return errorDetails.join(' - ');
					});
				} else if (errorMessage && errorMessage !== '') {
					toast.error(errorMessage);
				} else {
					toast.error('Failed to import/modify batch');
				}
				return;
			}

			await fetchBatches();
			const wasModifyMode = isModifyMode;
			resetForm();
			toast.success(wasModifyMode ? 'Batch modified successfully' : 'Batch imported successfully');
		} catch (err) {
			toast.error(
				(err as Error).message ||
					'An error occurred while processing your request, please try again later'
			);
		} finally {
			isLoading = false;
		}
	}

	async function handleDeleteBatch(batch: Batch): Promise<void> {
		try {
			isLoading = true;

			const formData = new FormData();
			formData.append('batch_id', batch.batch_id);

			const { success, errors } = await deleteBatch(formData);

			if (!success) {
				toast.error(
					errors?.map((error: ValidationError) => error.detail).join(', ') ||
						'Failed to delete batch'
				);
				return;
			}

			await fetchBatches();
			dialogOpen = false;
			toast.success('Batch deleted successfully');
		} catch (err) {
			toast.error(
				(err as Error).message ||
					'An error occurred while processing your request, please try again later'
			);
		} finally {
			isLoading = false;
			resetForm();
		}
	}

	function handleSchemasSelected(schemas: string[]): void {
		schemasSelected = schemas;
	}

	function resetForm(): void {
		schemasSelected = [];
		title = '';
		file = undefined;
		errorsMessage = null;
		isModifyMode = false;
		currentBatchId = null;
	}

	async function fetchBatches(): Promise<void> {
		try {
			const { data: batches, success } = await getBatches();
			if (success) {
				batchCards = batches.map((batch: Batch) => ({
					title: batch.title,
					batch_id: batch.batch_id,
					schemas: batch.schemas
				}));
			} else {
				toast.error('Failed to fetch batches');
			}
		} catch (err) {
			toast.error('Error fetching batches: ' + (err as Error).message);
		}
	}

	function handleModify(batch: Batch): void {
		title = batch.title;
		schemasSelected = batch.schemas;
		currentBatchId = batch.batch_id;
		isModifyMode = true;
	}
</script>

<div class="container mx-auto">
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- BEGIN: List of batches -->
		<div class="md:col-span-1 space-y-4 overflow-auto">
			{#if batchCards.length === 0}
				<Card>
					<CardContent class="p-6">
						<div class="space-y-4">
							{#if !isDbOnline}
								<p class="font-medium text-foreground">
									Unable to connect to the database, Unable to load batches
								</p>
							{:else if !user}
								<p class="font-medium text-foreground">
									Login first if you want to save your batch here, or just create a batch by
									selecting a schema from the list.
								</p>
								<p class="font-medium text-foreground pt-4">
									<a
										href="https://docs.murmurations.network/guides/create-a-profile.html#_2-hosted-by-our-profile-generator"
										target="_blank"
										class="text-primary hover:text-primary/80 underline"
										>See our documentation for details</a
									>
								</p>
							{:else}
								<p class="font-medium text-foreground">No saved batches found</p>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/if}
			{#each batchCards as batch (batch.batch_id)}
				<Card class="transition-all duration-200 hover:shadow-md border-border">
					<CardContent class="p-6">
						<div class="flex items-start justify-between">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-3 mb-3">
									<h3 class="text-lg font-semibold text-foreground">{batch.title}</h3>
								</div>

								<div class="space-y-2">
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<Hash class="h-4 w-4" />
										<span class="font-mono text-xs bg-muted px-2 py-1 rounded"
											>{batch.batch_id}</span
										>
									</div>

									<div class="space-y-1">
										{#each batch.schemas as schema (schema)}
											<div class="flex items-center gap-2 text-sm text-muted-foreground">
												<Database class="h-4 w-4" />
												<span class="font-mono text-xs bg-muted px-2 py-1 rounded">{schema}</span>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>

						<Separator class="my-4" />

						<div class="flex items-center gap-3">
							<Button
								onclick={() => handleModify(batch)}
								size="sm"
								class="flex items-center gap-2"
								disabled={!isDbOnline || isLoading}
							>
								<Edit class="h-4 w-4" />
								Modify
							</Button>
							<AlertDialog.Root bind:open={dialogOpen}>
								<AlertDialog.Trigger
									class={buttonVariants({
										variant: 'outline',
										size: 'sm'
									}) +
										' flex items-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 bg-transparent cursor-pointer'}
									disabled={!isDbOnline}
								>
									<Trash2 class="h-4 w-4" />
									Delete
								</AlertDialog.Trigger>
								<AlertDialog.Content>
									<AlertDialog.Header>
										<AlertDialog.Title>Delete Batch</AlertDialog.Title>
									</AlertDialog.Header>
									<AlertDialog.Description>
										<p>
											Are you sure you want to delete the batch: {batch.title}?
										</p>
									</AlertDialog.Description>
									<AlertDialog.Footer>
										<AlertDialog.Cancel class="cursor-pointer">Cancel</AlertDialog.Cancel>
										<AlertDialog.Action
											class="cursor-pointer"
											onclick={() => handleDeleteBatch(batch)}>Continue</AlertDialog.Action
										>
									</AlertDialog.Footer>
								</AlertDialog.Content>
							</AlertDialog.Root>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
		<!-- END: List of batches -->
		<!-- BEGIN: Schema selection box and import form -->
		<div class="md:col-span-2 space-y-4">
			{#if errorsMessage !== null}
				<Alert variant="destructive">
					<AlertDescription>
						<p class="font-medium">There were errors in your submission:</p>
						<ul class="mt-2">
							{#each errorsMessage as error (error)}
								<li class="font-medium list-disc list-inside">{error}</li>
							{/each}
						</ul>
					</AlertDescription>
				</Alert>
			{/if}
			{#if schemasSelected.length === 0}
				<SchemaSelector
					schemasList={data.schemasList.map((schema: BasicSchema) => schema.name)}
					schemaSelected={handleSchemasSelected}
				/>
			{:else}
				<Card>
					<CardContent class="p-6">
						<form onsubmit={handleImportOrModify} class="space-y-6">
							<div class="font-medium text-lg">
								{isModifyMode ? 'Modify the batch' : 'Import a new batch'}
							</div>
							<div class="space-y-2">
								<h3 class="font-medium">Schemas selected:</h3>
								<div class="space-y-1">
									{#each schemasSelected as schemaName (schemaName)}
										<Badge variant="secondary">
											<code>{schemaName}</code>
										</Badge>
									{/each}
								</div>
							</div>
							<div class="space-y-2">
								<Label for="title">
									Title<span class="ml-1 text-destructive">*</span>
								</Label>
								<Input type="text" id="title" name="title" bind:value={title} required />
							</div>
							<div class="space-y-2">
								<Label for="file">
									Upload File<span class="ml-1 text-destructive">*</span>
								</Label>
								<Input
									type="file"
									id="file"
									name="file"
									bind:files={file}
									required
									multiple={false}
								/>
							</div>
							<div class="flex justify-around gap-4">
								<Button type="submit" class="font-semibold" disabled={isLoading}>
									{isModifyMode ? 'Modify' : 'Import'}
								</Button>
								<Button
									type="button"
									variant="outline"
									class="font-semibold"
									onclick={resetForm}
									disabled={isLoading}
								>
									Reset
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			{/if}
		</div>
		<!-- END: Schema selection box and import form -->
	</div>
</div>
