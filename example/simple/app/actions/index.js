import {
  createEntity,
  updateEntity,
} from '../../../../src/helpers';
import {
  loadEntities,
} from '../../../../src/middleware';
import schemas from '../schemas';


export const LOAD_GROUPS = 'LOAD_GROUPS';
export const LOAD_GROUPS_DONE = 'LOAD_GROUPS_DONE';

export function loadGroups() {
  return loadEntities(schemas.Group, {
    type: LOAD_GROUPS,
  });
}


export const CREATE_GROUP = 'CREATE_GROUP';

export function createGroup(group) {
  return createEntity(schemas.Group, group);
}


export const CHECK_TASK = 'CHECK_TASK';

export function checkTask(task) {
  const id = task.id ? task.id : task;
  return updateEntity(schemas.Task, id, 'payload.data', {
    type: CHECK_TASK,
    payload: {
      data: { done: true },
    },
  });
}


export function uncheckTask(task) {
  const id = task.id ? task.id : task;
  return updateEntity(schemas.Task, id, 'payload.data', {
    type: CHECK_TASK,
    payload: {
      data: { done: false },
    },
  });
}
