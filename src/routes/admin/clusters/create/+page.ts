import { getCountries } from '$lib/api/countries';
import { getSchemas } from '$lib/api/schemas';
import { getSourceIndexes } from '$lib/api/source-indexes';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const { data: sourceIndexes } = await getSourceIndexes(fetch);

	// Use the first source index as the default
	const defaultSourceIndex = sourceIndexes[0];

	const { data: rawCountries } = await getCountries(
		`${defaultSourceIndex?.libraryUrl}/countries`,
		fetch
	);

	const countries = Object.entries(rawCountries).map(([key, names]) => ({
		value: key,
		// Use the second element as the label if available, otherwise use the first element
		label: Array.isArray(names)
			? (names[1] || names[0])
					.split(' ')
					.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ')
			: ''
	}));

	// Get the schema for the source index
	const { data: allSchemas } = await getSchemas(`${defaultSourceIndex?.libraryUrl}/schemas`, fetch);

	const schemas = allSchemas
		.filter((schema: { name: string }) => !schema.name.startsWith('test_'))
		.map(({ name }) => ({
			value: name,
			label: name
		}))
		.sort((a, b) => a.label.localeCompare(b.label));

	return {
		title: 'Create a Cluster',
		countries,
		schemas,
		sourceIndexes
	};
};
