import { spawnSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const container = `closet-theory-import-${randomUUID()}`;
function docker(args, input) {
  const result = spawnSync('docker', args, {
    input,
    encoding: 'utf8',
    timeout: 30000,
  });
  if (result.status !== 0)
    throw new Error(
      result.stderr ||
        result.error?.message ||
        'Local PostgreSQL operation failed',
    );
  return result.stdout;
}
const sql = (input) =>
  docker(
    [
      'exec',
      '-i',
      container,
      'psql',
      '-U',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-q',
    ],
    input,
  );
function parallelSql(input) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'docker',
      [
        'exec',
        '-i',
        container,
        'psql',
        '-U',
        'postgres',
        '-v',
        'ON_ERROR_STOP=1',
        '-q',
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
    let error = '';
    child.stderr.on('data', (bytes) => {
      error += bytes;
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(error)),
    );
    child.stdin.end(input);
  });
}
try {
  // Existing official image only; no network, published ports, volumes or hosted credentials.
  docker([
    'run',
    '--pull=never',
    '--rm',
    '--detach',
    '--network',
    'none',
    '--name',
    container,
    '-e',
    'POSTGRES_HOST_AUTH_METHOD=trust',
    'postgres:17-alpine',
  ]);
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      // The entrypoint briefly starts a temporary initialization server first.
      if (
        docker(['exec', container, 'cat', '/proc/1/comm']).trim() !== 'postgres'
      )
        throw new Error('PostgreSQL entrypoint is still initializing');
      docker(['exec', container, 'pg_isready', '-U', 'postgres']);
      ready = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  if (!ready) throw new Error('Disposable PostgreSQL did not start');
  sql(`create role anon; create role authenticated; create schema auth;
create function auth.jwt() returns jsonb language sql stable as 'select current_setting(''request.jwt.claims'',true)::jsonb';
grant usage on schema auth,public to authenticated,anon; grant execute on function auth.jwt() to authenticated,anon;`);
  for (const file of [
    '202611230001_account_foundation.sql',
    '202611230002_visitor_import.sql',
  ])
    sql(readFileSync(`supabase/migrations/${file}`, 'utf8'));
  sql(readFileSync('tests/integration/visitor-import.sql', 'utf8'));
  const item = {
    id: 'concurrent-selection',
    typeId: 'sneakers',
    name: 'Concurrent shoes',
    color: 'white',
    formality: 'Casual',
    seasons: ['Summer'],
    pattern: 'Solid',
  };
  const batch = randomUUID();
  const request = (operationId) =>
    `set role authenticated; select set_config('request.jwt.claims','{"sub":"user_concurrent","email_verified":true}',false); select public.import_visitor_wardrobe('${operationId}','UTC','${JSON.stringify([item])}');`;
  await Promise.all([
    parallelSql(request(batch)),
    parallelSql(request(batch)),
    parallelSql(request(randomUUID())),
  ]);
  sql(
    `do $$ begin if (select count(*) from public.wardrobe_items where owner_id = 'user_concurrent') <> 1 then raise exception 'concurrent imports duplicated clothes'; end if; end $$;`,
  );
  console.log(
    'PostgreSQL import migration, matching, rollback, replay, concurrency and RLS checks passed.',
  );
} finally {
  docker(['stop', container]);
  console.log('Disposable local PostgreSQL container removed.');
}
