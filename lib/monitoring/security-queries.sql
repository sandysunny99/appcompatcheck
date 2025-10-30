-- Security Monitoring Queries
-- Collection of SQL queries for security dashboard and alerting

-- ============================================================================
-- Active Attack Detection Queries
-- ============================================================================

-- Query 1: Detect Active Brute Force Attacks (Last Hour)
-- Identifies IPs with high failed login attempts
SELECT 
  ip_address,
  COUNT(*) as attempt_count,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt,
  COUNT(DISTINCT user_id) as targeted_accounts
FROM security_events 
WHERE event_type IN ('login_failure', 'authentication_failed')
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address 
HAVING COUNT(*) > 10
ORDER BY attempt_count DESC
LIMIT 100;

-- Query 2: Detect Distributed Brute Force (Multiple IPs, Same Account)
SELECT 
  user_id,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(*) as total_attempts,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM security_events
WHERE event_type = 'login_failure'
  AND created_at > NOW() - INTERVAL '1 hour'
  AND user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(DISTINCT ip_address) > 5
ORDER BY unique_ips DESC, total_attempts DESC;

-- Query 3: Account Lockout Activity (Last 24 Hours)
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as lockout_count,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT user_id) as affected_users
FROM security_events
WHERE event_type = 'account_locked'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- ============================================================================
-- Password Security Queries
-- ============================================================================

-- Query 4: Password Policy Effectiveness
SELECT 
  DATE(created_at) as day,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN metadata->>'weak_password' = 'true' THEN 1 ELSE 0 END) as weak_rejections,
  SUM(CASE WHEN metadata->>'common_password' = 'true' THEN 1 ELSE 0 END) as common_rejections,
  SUM(CASE WHEN metadata->>'breached_password' = 'true' THEN 1 ELSE 0 END) as breached_rejections,
  ROUND(100.0 * SUM(CASE WHEN metadata->>'weak_password' = 'true' THEN 1 ELSE 0 END) / COUNT(*), 2) as rejection_rate
FROM security_events 
WHERE event_type = 'password_validation_failed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- Query 5: Common Password Attempt Trends
SELECT 
  metadata->>'attempted_password_pattern' as pattern,
  COUNT(*) as attempt_count,
  COUNT(DISTINCT ip_address) as unique_ips,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM security_events
WHERE event_type = 'password_validation_failed'
  AND metadata->>'common_password' = 'true'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY metadata->>'attempted_password_pattern'
HAVING COUNT(*) > 5
ORDER BY attempt_count DESC
LIMIT 50;

-- ============================================================================
-- Input Validation & Attack Patterns
-- ============================================================================

-- Query 6: SQL Injection Attempts Detection
SELECT 
  ip_address,
  COUNT(*) as attempt_count,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt,
  ARRAY_AGG(DISTINCT metadata->>'endpoint') as targeted_endpoints
FROM security_events
WHERE event_type = 'sql_injection_attempt'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) > 3
ORDER BY attempt_count DESC;

-- Query 7: XSS Attack Attempts
SELECT 
  ip_address,
  COUNT(*) as attempt_count,
  COUNT(DISTINCT metadata->>'payload_type') as payload_variety,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM security_events
WHERE event_type = 'xss_attempt'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) > 3
ORDER BY attempt_count DESC;

-- Query 8: Path Traversal Attempts
SELECT 
  ip_address,
  COUNT(*) as attempt_count,
  ARRAY_AGG(DISTINCT metadata->>'requested_path') as attempted_paths,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM security_events
WHERE event_type = 'path_traversal_attempt'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY attempt_count DESC;

-- ============================================================================
-- Rate Limiting & Traffic Analysis
-- ============================================================================

-- Query 9: Rate Limit Violations by Endpoint
SELECT 
  endpoint,
  COUNT(*) as violation_count,
  COUNT(DISTINCT identifier) as unique_identifiers,
  AVG((metadata->>'attempts')::int) as avg_attempts
FROM rate_limit_logs
WHERE is_blocked = true
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY violation_count DESC;

-- Query 10: Currently Blocked Identifiers
SELECT 
  identifier,
  endpoint,
  attempts,
  blocked_until,
  block_reason,
  EXTRACT(EPOCH FROM (blocked_until - NOW())) as seconds_remaining
FROM rate_limit_logs
WHERE is_blocked = true
  AND blocked_until > NOW()
ORDER BY blocked_until ASC;

-- Query 11: Rate Limiting Effectiveness
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_requests,
  SUM(CASE WHEN is_blocked THEN 1 ELSE 0 END) as blocked_requests,
  ROUND(100.0 * SUM(CASE WHEN is_blocked THEN 1 ELSE 0 END) / COUNT(*), 2) as block_percentage
FROM rate_limit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- ============================================================================
-- Security Event Analytics
-- ============================================================================

-- Query 12: Security Events by Severity (Last 7 Days)
SELECT 
  severity,
  COUNT(*) as event_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
FROM security_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY severity
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- Query 13: Top Security Event Types
SELECT 
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT user_id) as affected_users,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM security_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY event_count DESC
LIMIT 20;

-- Query 14: Security Events Timeline (Hourly)
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  event_type,
  severity,
  COUNT(*) as event_count
FROM security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), event_type, severity
ORDER BY hour DESC, event_count DESC;

-- ============================================================================
-- User Behavior Analysis
-- ============================================================================

-- Query 15: Suspicious User Activity Patterns
SELECT 
  user_id,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT user_agent) as unique_user_agents,
  COUNT(*) as total_events,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event
FROM security_events
WHERE created_at > NOW() - INTERVAL '7 days'
  AND user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(DISTINCT ip_address) > 10
   OR COUNT(DISTINCT user_agent) > 5
ORDER BY unique_ips DESC;

-- Query 16: Geographic Anomalies (Requires IP geolocation data)
-- Note: Assumes metadata contains geolocation info
SELECT 
  user_id,
  COUNT(DISTINCT metadata->>'country') as unique_countries,
  ARRAY_AGG(DISTINCT metadata->>'country') as countries,
  COUNT(*) as login_count,
  MAX(created_at) - MIN(created_at) as time_span
FROM security_events
WHERE event_type = 'login_success'
  AND created_at > NOW() - INTERVAL '24 hours'
  AND user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(DISTINCT metadata->>'country') > 3
ORDER BY unique_countries DESC;

-- ============================================================================
-- Alert Threshold Checks
-- ============================================================================

-- Query 17: Check Alert Thresholds (Rate Limiting)
SELECT 
  'Rate Limit Exceeded' as alert_type,
  COUNT(*) as events_last_5_min,
  CASE 
    WHEN COUNT(*) > 50 THEN 'CRITICAL'
    WHEN COUNT(*) > 20 THEN 'WARNING'
    ELSE 'NORMAL'
  END as alert_level
FROM security_events
WHERE event_type = 'rate_limit_exceeded'
  AND created_at > NOW() - INTERVAL '5 minutes';

-- Query 18: Check Alert Thresholds (Account Lockouts)
SELECT 
  'Account Lockouts' as alert_type,
  COUNT(*) as events_last_hour,
  CASE 
    WHEN COUNT(*) > 10 THEN 'WARNING'
    ELSE 'NORMAL'
  END as alert_level
FROM security_events
WHERE event_type = 'account_locked'
  AND created_at > NOW() - INTERVAL '1 hour';

-- Query 19: Check Alert Thresholds (Failed Logins)
SELECT 
  'Failed Logins' as alert_type,
  COUNT(*) as events_last_hour,
  COUNT(DISTINCT ip_address) as unique_ips,
  CASE 
    WHEN COUNT(*) > 100 THEN 'WARNING'
    WHEN COUNT(DISTINCT ip_address) > 50 THEN 'CRITICAL'
    ELSE 'NORMAL'
  END as alert_level
FROM security_events
WHERE event_type = 'login_failure'
  AND created_at > NOW() - INTERVAL '1 hour';

-- ============================================================================
-- Performance & Health Metrics
-- ============================================================================

-- Query 20: Security Event Processing Performance
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as events_per_minute,
  AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) as avg_time_between_events
FROM security_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', created_at)
ORDER BY minute DESC;

-- Query 21: Database Health Check
SELECT 
  (SELECT COUNT(*) FROM security_events WHERE created_at > NOW() - INTERVAL '1 hour') as events_last_hour,
  (SELECT COUNT(*) FROM rate_limit_logs WHERE created_at > NOW() - INTERVAL '1 hour') as rate_limit_logs_last_hour,
  (SELECT pg_database_size(current_database())) as database_size_bytes,
  (SELECT COUNT(*) FROM security_events WHERE created_at < NOW() - INTERVAL '90 days') as events_to_archive;

-- ============================================================================
-- Cleanup & Maintenance Queries
-- ============================================================================

-- Query 22: Archive Old Security Events (Run Periodically)
-- This query identifies events older than retention period
SELECT COUNT(*) as events_to_archive
FROM security_events
WHERE created_at < NOW() - INTERVAL '90 days';

-- Query 23: Clean Up Expired Rate Limit Logs
-- Identifies logs that can be safely deleted
SELECT COUNT(*) as logs_to_cleanup
FROM rate_limit_logs
WHERE created_at < NOW() - INTERVAL '7 days'
  AND (blocked_until IS NULL OR blocked_until < NOW());
