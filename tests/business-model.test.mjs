import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  validateActivity,
  validateOperation,
  validateProject,
  validateWorkspaceLink
} from '../services/api/domain/models.mjs';

const id = '11111111-1111-4111-8111-111111111111';
const id2 = '22222222-2222-4222-8222-222222222222';

describe('business domain models', () => {
  it('accepts a project and rejects unsafe slugs', () => {
    assert.equal(validateProject({ id, ownerUserId: 'user_1', name: 'Demo', slug: 'demo' }).slug, 'demo');
    assert.throws(() => validateProject({ id, ownerUserId: 'user_1', name: 'Demo', slug: '../demo' }), /slug/);
  });

  it('validates Coder workspace links by UUID reference', () => {
    assert.equal(validateWorkspaceLink({ id, projectId: id2, coderWorkspaceId: id }).projectId, id2);
    assert.throws(() => validateWorkspaceLink({ id, projectId: id2, coderWorkspaceId: 'not-a-uuid' }), /UUID/);
  });

  it('keeps product operation statuses separate from Coder statuses', () => {
    assert.equal(validateOperation({ id, projectId: id2, status: 'running', action: 'workspace.start' }).status, 'running');
    assert.throws(() => validateOperation({ id, projectId: id2, status: 'provisioning', action: 'workspace.start' }), /status/);
  });

  it('accepts only known activity types', () => {
    assert.equal(validateActivity({ id, projectId: id2, type: 'operation.failed', actorUserId: 'user_1' }).type, 'operation.failed');
    assert.throws(() => validateActivity({ id, projectId: id2, type: 'secret.exposed', actorUserId: 'user_1' }), /type/);
  });

  it('keeps the prepared schema independent from Coder tables', async () => {
    const migration = await readFile(new URL('../services/api/domain/migrations/001_initial.up.sql', import.meta.url), 'utf8');
    for (const table of ['projects', 'project_members', 'workspace_links', 'operations', 'activities']) {
      assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
    }
    assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS (workspaces|provisioner_jobs|terraform)/i);
    assert.match(migration, /FRANKENSTEIN_DATABASE_URL|business database/i);
  });
});
