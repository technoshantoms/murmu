INSERT INTO `capabilities` (`scheme`, `hier_part`, `namespace`, `segments`)
VALUES
  ('api', '/clusters/*/nodes/status', 'clusters', 'PUT'),
  ('api', '/clusters/*/update-nodes', 'clusters', 'POST');
--> statement-breakpoint
INSERT INTO `role_capabilities` (`role_id`, `capability_id`)
SELECT 
  r.id AS role_id,
  c.id AS capability_id
FROM roles r
JOIN capabilities c
  ON c.scheme = 'api'
  AND c.namespace = 'clusters'
  AND (c.hier_part, c.segments) IN (
    ('/clusters/*/nodes/status', 'PUT'),
    ('/clusters/*/update-nodes', 'POST')
  )
WHERE r.name = 'Root';
