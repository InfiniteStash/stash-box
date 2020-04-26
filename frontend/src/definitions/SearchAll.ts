/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: SearchAll
// ====================================================

export interface SearchAll_searchPerformer_birthdate {
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SearchAll_searchPerformer_urls {
  url: string;
  type: string;
}

export interface SearchAll_searchPerformer_images {
  id: string;
  url: string;
  height: number | null;
  width: number | null;
}

export interface SearchAll_searchPerformer {
  id: string;
  name: string;
  disambiguation: string | null;
  gender: GenderEnum | null;
  aliases: string[];
  birthdate: SearchAll_searchPerformer_birthdate | null;
  urls: SearchAll_searchPerformer_urls[];
  images: SearchAll_searchPerformer_images[];
}

export interface SearchAll_searchScene_urls {
  url: string;
  type: string;
}

export interface SearchAll_searchScene_images {
  id: string;
  url: string;
  height: number | null;
  width: number | null;
}

export interface SearchAll_searchScene_studio {
  id: string;
  name: string;
}

export interface SearchAll_searchScene_performers_performer {
  name: string;
  id: string;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface SearchAll_searchScene_performers {
  /**
   * Performing as alias
   */
  as: string | null;
  performer: SearchAll_searchScene_performers_performer;
}

export interface SearchAll_searchScene {
  id: string;
  date: any | null;
  title: string | null;
  urls: SearchAll_searchScene_urls[];
  images: SearchAll_searchScene_images[];
  studio: SearchAll_searchScene_studio | null;
  performers: SearchAll_searchScene_performers[];
}

export interface SearchAll {
  searchPerformer: (SearchAll_searchPerformer | null)[];
  searchScene: (SearchAll_searchScene | null)[];
}

export interface SearchAllVariables {
  term: string;
}
