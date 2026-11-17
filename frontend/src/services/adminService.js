// Admin data, read straight from Supabase. Row-Level Security only returns
// other users' rows when the logged-in user has users.role = 'admin'
// (see is_admin() in the migration), so this is safe to call from the app.
import { supabase } from '../lib/supabase';

async function count(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: n, error } = await q;
  if (error) throw new Error(error.message);
  return n ?? 0;
}

export async function fetchAdminOverview() {
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

  const [totalUsers, newUsers, admins, totalScans, users, activity] = await Promise.all([
    count('users'),
    count('users', (q) => q.gte('created_at', weekAgo)),
    count('users', (q) => q.eq('role', 'admin')),
    count('scans'),
    supabase
      .from('users')
      .select('user_id, email, first_name, last_name, role, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('audit_logs')
      .select('log_id, action, created_at, users(email)')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (users.error) throw new Error(users.error.message);
  if (activity.error) throw new Error(activity.error.message);

  return {
    stats: { totalUsers, newUsers, admins, totalScans },
    users: users.data,
    activity: activity.data,
  };
}
