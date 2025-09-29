import { getLibrarySchemas } from '$lib/api/schemas';
import { getToken } from '$lib/core';
import type { BasicSchema } from '$lib/types/schema';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const currentToken = await getToken('currentToken');
		const { data: schemas, error } = await getLibrarySchemas(fetch);
		const schemasList = schemas
			.filter((s: BasicSchema) => {
				return !s.name.startsWith('default-v');
			})
			.filter((s: BasicSchema) => {
				return !s.name.startsWith('test_schema-v');
			});

		return { title: 'Profile Generator', user: currentToken, schemasList, errorMessage: error };
	} catch (err) {
		console.error('Error fetching schemas:', err);
		return { title: 'Profile Generator', schemasList: [], errorMessage: 'Error fetching schemas' };
	}
};
