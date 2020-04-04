/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Tag
// ====================================================

export interface Tag_findTag {
  id: string;
  name: string;
  description: string | null;
}

export interface Tag {
  /**
   * Find a tag by ID or name, or aliases
   */
  findTag: Tag_findTag | null;
}

export interface TagVariables {
  name?: string | null;
  id?: string | null;
}
