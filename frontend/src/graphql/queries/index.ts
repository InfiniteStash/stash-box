import { useContext } from "react";
import {
  useQuery,
  useLazyQuery,
  QueryHookOptions,
  LazyQueryHookOptions,
} from "@apollo/client";

import AuthContext from "src/AuthContext";
import { isAdmin } from "src/utils";

import {
  CategoryQuery,
  CategoryQueryVariables,
  CategoriesQuery,
  CategoriesQueryVariables,
  EditQuery,
  EditQueryVariables,
  EditsQuery,
  EditsQueryVariables,
  MeQuery,
  PerformerQuery,
  PerformerQueryVariables,
  FullPerformerQuery,
  FullPerformerQueryVariables,
  PerformersQuery,
  PerformersQueryVariables,
  SceneQuery,
  SceneQueryVariables,
  ScenesQuery,
  ScenesQueryVariables,
  ScenesWithoutCountQuery,
  ScenesWithoutCountQueryVariables,
  SearchAllQuery,
  SearchAllQueryVariables,
  SearchPerformersQuery,
  SearchPerformersQueryVariables,
  StudioQuery,
  StudioQueryVariables,
  StudiosQuery,
  StudiosQueryVariables,
  TagQuery,
  TagQueryVariables,
  TagsQuery,
  TagsQueryVariables,
  UserQuery,
  UserQueryVariables,
  UsersQuery,
  UsersQueryVariables,
  PublicUserQuery,
  PublicUserQueryVariables,
  ConfigQuery,
  VersionQuery,
  PendingEditsCountQuery,
  PendingEditsCountQueryVariables,
  SiteQuery,
  SiteQueryVariables,
  SitesQuery,
  DraftQuery,
  DraftQueryVariables,
  DraftsQuery,
} from "../generated";

import Category from "./Category.gql";
import Categories from "./Categories.gql";
import Edit from "./Edit.gql";
import Edits from "./Edits.gql";
import Me from "./Me.gql";
import Performer from "./Performer.gql";
import FullPerformer from "./FullPerformer.gql";
import Performers from "./Performers.gql";
import Scene from "./Scene.gql";
import Scenes from "./Scenes.gql";
import ScenesWithoutCount from "./ScenesWithoutCount.gql";
import SearchAll from "./SearchAll.gql";
import SearchPerformers from "./SearchPerformers.gql";
import Studio from "./Studio.gql";
import Studios from "./Studios.gql";
import Tag from "./Tag.gql";
import Tags from "./Tags.gql";
import User from "./User.gql";
import Users from "./Users.gql";
import PublicUser from "./PublicUser.gql";
import Config from "./Config.gql";
import Version from "./Version.gql";
import PendingEditsCount from "./PendingEditsCount.gql";
import Site from "./Site.gql";
import Sites from "./Sites.gql";
import Draft from "./Draft.gql";
import Drafts from "./Drafts.gql";

export const useCategory = (variables: CategoryQueryVariables, skip = false) =>
  useQuery<CategoryQuery, CategoryQueryVariables>(Category, {
    variables,
    skip,
  });

export const useCategories = (variables?: CategoriesQueryVariables) =>
  useQuery<CategoriesQuery, CategoriesQueryVariables>(Categories, {
    variables,
  });

export const useEdit = (variables: EditQueryVariables) =>
  useQuery<EditQuery, EditQueryVariables>(Edit, {
    variables,
  });

export const useEdits = (variables: EditsQueryVariables) =>
  useQuery<EditsQuery, EditsQueryVariables>(Edits, {
    variables,
  });

export const useMe = (options?: QueryHookOptions<MeQuery>) =>
  useQuery<MeQuery>(Me, options);

export const usePerformer = (
  variables: PerformerQueryVariables,
  skip = false
) =>
  useQuery<PerformerQuery, PerformerQueryVariables>(Performer, {
    variables,
    skip,
  });

export const useFullPerformer = (
  variables: PerformerQueryVariables,
  skip = false
) =>
  useQuery<FullPerformerQuery, FullPerformerQueryVariables>(FullPerformer, {
    variables,
    skip,
  });

export const usePerformers = (variables: PerformersQueryVariables) =>
  useQuery<PerformersQuery, PerformersQueryVariables>(Performers, {
    variables,
  });

export const useScene = (variables: SceneQueryVariables, skip = false) =>
  useQuery<SceneQuery, SceneQueryVariables>(Scene, {
    variables,
    skip,
  });

export const useScenes = (variables: ScenesQueryVariables, skip = false) =>
  useQuery<ScenesQuery, ScenesQueryVariables>(Scenes, {
    variables,
    skip,
  });

export const useScenesWithoutCount = (
  variables: ScenesQueryVariables,
  skip = false
) =>
  useQuery<ScenesWithoutCountQuery, ScenesWithoutCountQueryVariables>(
    ScenesWithoutCount,
    {
      variables,
      skip,
    }
  );

export const useSearchAll = (
  variables: SearchAllQueryVariables,
  skip = false
) =>
  useQuery<SearchAllQuery, SearchAllQueryVariables>(SearchAll, {
    variables,
    skip,
  });

export const useSearchPerformers = (
  variables: SearchPerformersQueryVariables
) =>
  useQuery<SearchPerformersQuery, SearchPerformersQueryVariables>(
    SearchPerformers,
    {
      variables,
    }
  );

export const useLazySearchAll = (
  options?: LazyQueryHookOptions<SearchAllQuery, SearchAllQueryVariables>
) => useLazyQuery(SearchAll, options);

export const useLazySearchPerformers = (
  options?: LazyQueryHookOptions<
    SearchPerformersQuery,
    SearchPerformersQueryVariables
  >
) => useLazyQuery(SearchPerformers, options);

export const useStudio = (variables: StudioQueryVariables, skip = false) =>
  useQuery<StudioQuery, StudioQueryVariables>(Studio, {
    variables,
    skip,
  });

export const useStudios = (variables: StudiosQueryVariables) =>
  useQuery<StudiosQuery, StudiosQueryVariables>(Studios, {
    variables,
  });

export const useLazyStudios = (
  options?: LazyQueryHookOptions<StudiosQuery, StudiosQueryVariables>
) => useLazyQuery(Studios, options);

export const useTag = (variables: TagQueryVariables, skip = false) =>
  useQuery<TagQuery, TagQueryVariables>(Tag, {
    variables,
    skip,
  });

export const useTags = (variables: TagsQueryVariables) =>
  useQuery<TagsQuery, TagsQueryVariables>(Tags, {
    variables,
  });
export const useLazyTags = (
  options?: LazyQueryHookOptions<TagsQuery, TagsQueryVariables>
) => useLazyQuery(Tags, options);

export const usePrivateUser = (variables: UserQueryVariables, skip = false) =>
  useQuery<UserQuery, UserQueryVariables>(User, {
    variables,
    skip,
  });
export const usePublicUser = (
  variables: PublicUserQueryVariables,
  skip = false
) =>
  useQuery<PublicUserQuery, PublicUserQueryVariables>(PublicUser, {
    variables,
    skip,
  });

export const useUser = (variables: UserQueryVariables, skip = false) => {
  const Auth = useContext(AuthContext);
  const isUser = () => Auth.user?.name === variables.name;
  const showPrivate = isUser() || isAdmin(Auth.user);

  const privateUser = usePrivateUser(variables, skip || !showPrivate);
  const publicUser = usePublicUser(variables, skip || showPrivate);

  return showPrivate ? privateUser : publicUser;
};

export const useUsers = (variables: UsersQueryVariables) =>
  useQuery<UsersQuery, UsersQueryVariables>(Users, {
    variables,
  });

export const useConfig = () => useQuery<ConfigQuery>(Config);

export const useVersion = () => useQuery<VersionQuery>(Version);

export const usePendingEditsCount = (
  variables: PendingEditsCountQueryVariables
) =>
  useQuery<PendingEditsCountQuery, PendingEditsCountQueryVariables>(
    PendingEditsCount,
    { variables }
  );

export const useSite = (variables: SiteQueryVariables, skip = false) =>
  useQuery<SiteQuery, SiteQueryVariables>(Site, {
    variables,
    skip,
  });

export const useSites = () => useQuery<SitesQuery>(Sites);

export const useDraft = (variables: DraftQueryVariables, skip = false) =>
  useQuery<DraftQuery, DraftQueryVariables>(Draft, {
    variables,
    skip,
  });

export const useDrafts = () => useQuery<DraftsQuery>(Drafts);
