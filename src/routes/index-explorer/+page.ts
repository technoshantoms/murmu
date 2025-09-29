import { PUBLIC_LIBRARY_URL } from '$env/static/public';
import { getCountries } from '$lib/api/countries';
import { getLibrarySchemas } from '$lib/api/schemas';
import type { BasicSchema } from '$lib/types/schema';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	try {
		const { data: schemas, error: schemasError } = await getLibrarySchemas(fetch);
		const rawCountries = await getCountries(`${PUBLIC_LIBRARY_URL}/v2/countries`, fetch);

		const schemasList = schemas
			.filter((s: BasicSchema) => {
				return !s.name.startsWith('default-v');
			})
			.filter((s: BasicSchema) => {
				return !s.name.startsWith('test_schema-v');
			});

		const countries = Object.keys(rawCountries);

		return {
			title: 'Index Explorer',
			loadSearchParams: url.searchParams,
			schemasList,
			countries,
			errorMessage: schemasError
		};
	} catch (err) {
		console.error('Error fetching data:', err);
		return {
			title: 'Index Explorer',
			loadSearchParams: url.searchParams,
			schemasList: [],
			countries: [],
			errorMessage: 'Error fetching data'
		};
	}
};
