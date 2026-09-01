export type EntityId = string;

export type AuditMetadata = {
  createdAt: string;
  updatedAt: string;
  createdBy: EntityId;
  updatedBy: EntityId;
};
