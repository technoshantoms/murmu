<script lang="ts">
	import { page } from '$app/state';
	import AppSidebarAdmin from '$lib/components/app-sidebar-admin.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { children } = $props();

	const siteName = 'MurmurMaps Admin';
</script>

<svelte:head>
	<title>{page.data.title ? `${page.data.title} | ${siteName}` : siteName}</title>
</svelte:head>

<div class="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
	<Sidebar.Provider>
		<AppSidebarAdmin />
		<Sidebar.Inset>
			<header class="flex h-16 shrink-0 items-center gap-2 border-b">
				<div class="flex items-center gap-2 px-3">
					<Sidebar.Trigger />
					<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
					<Breadcrumb.Root>
						<Breadcrumb.List>
							<Breadcrumb.Item>
								<Breadcrumb.Link href="/admin">{siteName}</Breadcrumb.Link>
							</Breadcrumb.Item>
							{#if page.data.title}
								<Breadcrumb.Separator />
								<Breadcrumb.Item>
									<Breadcrumb.Page>{page.data.title}</Breadcrumb.Page>
								</Breadcrumb.Item>
							{/if}
						</Breadcrumb.List>
					</Breadcrumb.Root>
				</div>
			</header>
			<div class="flex flex-1 flex-col gap-4 p-4">
				{@render children()}
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
</div>
