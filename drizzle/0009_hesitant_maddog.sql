INSERT INTO `capabilities` (`scheme`, `hier_part`, `namespace`, `segments`)
VALUES
  ('api', '/clusters/*/nodes/status', 'clusters', 'PUT');
--> statement-breakpoint
INSERT INTO `role_capabilities` (`role_id`, `capability_id`)
SELECT 
  (SELECT id FROM roles WHERE name = 'Root'),
  id
FROM capabilities
WHERE scheme = 'api'
  AND hier_part = '/clusters/*/nodes/status'
  AND namespace = 'clusters'
  AND segments = 'PUT';