export interface Batch {
	title: string;
	batch_id: string;
	schemas: string[];
}

export interface BatchValidationError {
	status: number;
	source: {
		oid: string;
		pointer: string;
	};
	title: string;
	detail: string;
}
