export const PROJECT_ROLES = ['owner', 'admin', 'member', 'viewer'];
export const OPERATION_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'canceled'];
export const ACTIVITY_TYPES = ['project.created', 'workspace.linked', 'operation.started', 'operation.completed', 'operation.failed'];

const isUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const isNonEmpty = (value, max = 255) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

const assertFields = (record, fields, name) => {
  if (!record || typeof record !== 'object') throw new TypeError(`${name} must be an object`);
  for (const field of fields) if (!(field in record)) throw new TypeError(`${name}.${field} is required`);
};

export function validateProject(project) {
  assertFields(project, ['id', 'ownerUserId', 'name', 'slug'], 'project');
  if (!isUuid(project.id)) throw new TypeError('project.id must be a UUID');
  if (!isNonEmpty(project.ownerUserId, 255)) throw new TypeError('project.ownerUserId is required');
  if (!isNonEmpty(project.name, 120)) throw new TypeError('project.name is invalid');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(project.slug) || project.slug.length > 80) {
    throw new TypeError('project.slug is invalid');
  }
  return project;
}

export function validateWorkspaceLink(link) {
  assertFields(link, ['id', 'projectId', 'coderWorkspaceId'], 'workspaceLink');
  for (const field of ['id', 'projectId', 'coderWorkspaceId']) {
    if (!isUuid(link[field])) throw new TypeError(`workspaceLink.${field} must be a UUID`);
  }
  return link;
}

export function validateOperation(operation) {
  assertFields(operation, ['id', 'projectId', 'status', 'action'], 'operation');
  if (!isUuid(operation.id) || !isUuid(operation.projectId)) throw new TypeError('operation ids must be UUIDs');
  if (!OPERATION_STATUSES.includes(operation.status)) throw new TypeError('operation.status is invalid');
  if (!isNonEmpty(operation.action, 80)) throw new TypeError('operation.action is invalid');
  return operation;
}

export function validateActivity(activity) {
  assertFields(activity, ['id', 'projectId', 'type', 'actorUserId'], 'activity');
  if (!isUuid(activity.id) || !isUuid(activity.projectId)) throw new TypeError('activity ids must be UUIDs');
  if (!ACTIVITY_TYPES.includes(activity.type)) throw new TypeError('activity.type is invalid');
  if (!isNonEmpty(activity.actorUserId, 255)) throw new TypeError('activity.actorUserId is required');
  return activity;
}
