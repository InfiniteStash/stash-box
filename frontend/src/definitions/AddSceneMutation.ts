/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { SceneCreateInput, GenderEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddSceneMutation
// ====================================================

export interface AddSceneMutation_sceneCreate_urls {
  url: string;
  type: string;
}

export interface AddSceneMutation_sceneCreate_studio {
  id: string;
  name: string;
}

export interface AddSceneMutation_sceneCreate_performers_performer {
  name: string;
  id: string;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface AddSceneMutation_sceneCreate_performers {
  performer: AddSceneMutation_sceneCreate_performers_performer;
}

export interface AddSceneMutation_sceneCreate {
  id: string;
  date: any | null;
  title: string | null;
  details: string | null;
  urls: AddSceneMutation_sceneCreate_urls[];
  studio: AddSceneMutation_sceneCreate_studio | null;
  performers: AddSceneMutation_sceneCreate_performers[];
}

export interface AddSceneMutation {
  sceneCreate: AddSceneMutation_sceneCreate | null;
}

export interface AddSceneMutationVariables {
  sceneData: SceneCreateInput;
}
