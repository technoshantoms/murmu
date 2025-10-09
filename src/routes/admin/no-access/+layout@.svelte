<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
	{@render children()}
</div>
