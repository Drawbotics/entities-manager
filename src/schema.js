import isEmpty from 'lodash/isEmpty';
import { Schema, arrayOf } from 'normalizr';


export function defineSchema(name, attributes={}) {
  if (isEmpty(name)) {
    throw new Error('[INVALID NAME]');
  }
  if ((typeof attributes !== 'object') && attributes) {
    throw new Error('[INVALID ATTRIBUTES]');
  }
  return {
    name,
    attributes,
  };
}


export function hasMany(schema) {
  if (isEmpty(schema)) {
    throw new Error('[INVALID SCHEMA]');
  }
  if (typeof schema !== 'string' && ! schema.hasOwnProperty('name')) {
    throw new Error('[INVALID SCHEMA]');
  }
  return {
    relatedSchema: schema.hasOwnProperty('name') ? schema.name : schema,
    isArray: true,
  };
}


function getRelatedThrough(entity1, entity2) {
  return Object.keys(entity1).find(prop => {
    if (prop.startsWith('_')) {
      return false;
    }
    const relation = entity1[prop];
    if (relation.getKey) {
      return relation.getKey() === entity2.getKey();
    }
    else if (relation.getItemSchema) {
      return relation.getItemSchema().getKey() === entity2.getKey();
    }
    return false;
  });
}


function isRelatedTo(relatedEntities) {
  return (entityName) => relatedEntities.map(e => e.entity).includes(entityName);
}


function getRelation(schema, relatedEntities, bag) {
  return (entity, relatedEntityName) => {
    const { prop } = relatedEntities.find(e => e.entity === relatedEntityName);
    const relatedId = entity[prop];
    const relatedPropName = getRelatedThrough(bag[relatedEntityName], schema);
    return {
      related: relatedEntityName,
      relatedPropName,
      relatedId,
    };
  };
}


function generateSchema(schema, bag) {
  const relatedEntities = [];
  const schemaDefinition = Object.keys(schema.attributes).reduce((result, a) => {
    const attribute = schema.attributes[a];
    if (typeof attribute === 'function') {
      // Treat it like a computed property
      return { ...result, _computed: { ...result._computed, [a]: attribute } };
    }
    else if (typeof attribute === 'string') {
      // Single reference to another schema
      relatedEntities.push({ prop: a, entity: attribute });
      return { ...result, [a]: bag[attribute] };
    }
    else if (attribute.isArray) {
      // Array reference to another schema
      relatedEntities.push({ prop: a, entity: attribute.relatedSchema });
      return { ...result, [a]: arrayOf(bag[attribute.relatedSchema]) };
    }
    return result;  // Shouldn't never come to here
  }, {});
  const finalSchema = bag[schema.name];
  finalSchema.define(schemaDefinition);
  Object.defineProperty(finalSchema, 'isRelatedTo', {
    enumerable: false,
    value: isRelatedTo(relatedEntities),
  });
  Object.defineProperty(finalSchema, 'getRelation', {
    enumerable: false,
    value: getRelation(finalSchema, relatedEntities, bag),
  });
  return finalSchema;
}


export function generateSchemas(schemas) {
  if (isEmpty(schemas)) {
    throw new Error('[INVALID SCHEMAS]');
  }
  if ( ! Array.isArray(schemas)) {
    throw new Error('[INVALID SCHEMAS]');
  }
  const schemasBag = schemas.reduce((bag, s) => ({
    ...bag,
    [s.name]: new Schema(s.name),
  }), {});
  return schemas.reduce((result, s) => ({
    ...result,
    [s.name]: generateSchema(s, schemasBag),
  }), {});
}
