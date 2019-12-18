/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { SceneUpdateInput, GenderEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateSceneMutation
// ====================================================

export interface UpdateSceneMutation_sceneUpdate_urls {
  url: string;
  type: string;
}

export interface UpdateSceneMutation_sceneUpdate_studio {
  id: string;
  name: string;
}

export interface UpdateSceneMutation_sceneUpdate_performers_performer {
  name: string;
  id: string;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface UpdateSceneMutation_sceneUpdate_performers {
  performer: UpdateSceneMutation_sceneUpdate_performers_performer;
}

export interface UpdateSceneMutation_sceneUpdate {
  id: string;
  date: any | null;
  title: string | null;
  urls: UpdateSceneMutation_sceneUpdate_urls[];
  studio: UpdateSceneMutation_sceneUpdate_studio | null;
  performers: UpdateSceneMutation_sceneUpdate_performers[];
}

export interface UpdateSceneMutation {
  sceneUpdate: UpdateSceneMutation_sceneUpdate | null;
}

export interface UpdateSceneMutationVariables {
  updateData: SceneUpdateInput;
}
