import { useMutation, MutationHookOptions } from "@apollo/client";

import {
  ActivateNewUserMutation,
  ActivateNewUserMutationVariables,
  AddUserMutation,
  AddUserMutationVariables,
  NewUserMutation,
  NewUserMutationVariables,
  UpdateUserMutation,
  UpdateUserMutationVariables,
  DeleteUserMutation,
  DeleteUserMutationVariables,
  AddTagCategoryMutation,
  AddTagCategoryMutationVariables,
  DeleteTagCategoryMutation,
  DeleteTagCategoryMutationVariables,
  UpdateTagCategoryMutation,
  UpdateTagCategoryMutationVariables,
  AddImageMutation,
  AddImageMutationVariables,
  PerformerEditMutation,
  PerformerEditMutationVariables,
  TagEditMutation,
  TagEditMutationVariables,
  AddSceneMutation,
  AddSceneMutationVariables,
  DeleteSceneMutation,
  DeleteSceneMutationVariables,
  UpdateSceneMutation,
  UpdateSceneMutationVariables,
  AddStudioMutation,
  AddStudioMutationVariables,
  DeleteStudioMutation,
  DeleteStudioMutationVariables,
  UpdateStudioMutation,
  UpdateStudioMutationVariables,
  ApplyEditMutation,
  ApplyEditMutationVariables,
  CancelEditMutation,
  CancelEditMutationVariables,
  ChangePasswordMutation,
  ChangePasswordMutationVariables,
  ResetPasswordMutation,
  ResetPasswordMutationVariables,
  RegenerateApiKeyMutation,
  RegenerateApiKeyMutationVariables,
  GenerateInviteCodeMutation,
  GrantInviteMutation,
  GrantInviteMutationVariables,
  RescindInviteCodeMutation,
  RescindInviteCodeMutationVariables,
  RevokeInviteMutation,
  RevokeInviteMutationVariables,
  EditCommentMutation,
  EditCommentMutationVariables,
  StudioEditMutation,
  StudioEditMutationVariables,
  SceneEditMutation,
  SceneEditMutationVariables,
  VoteMutation,
  VoteMutationVariables,
  AddSiteMutation,
  AddSiteMutationVariables,
  DeleteSiteMutation,
  DeleteSiteMutationVariables,
  UpdateSiteMutation,
  UpdateSiteMutationVariables,
  FavoriteStudioMutation,
  FavoriteStudioMutationVariables,
  FavoritePerformerMutation,
  FavoritePerformerMutationVariables,
  DeleteDraftMutation,
  DeleteDraftMutationVariables,
} from "../generated";

import ActivateUser from "./ActivateNewUser.gql";
import AddUser from "./AddUser.gql";
import NewUser from "./NewUser.gql";
import UpdateUser from "./UpdateUser.gql";
import DeleteUser from "./DeleteUser.gql";
import AddTagCategory from "./AddTagCategory.gql";
import DeleteTagCategory from "./DeleteTagCategory.gql";
import UpdateTagCategory from "./UpdateTagCategory.gql";
import AddImage from "./AddImage.gql";
import PerformerEdit from "./PerformerEdit.gql";
import TagEdit from "./TagEdit.gql";
import StudioEdit from "./StudioEdit.gql";
import SceneEdit from "./SceneEdit.gql";
import AddScene from "./AddScene.gql";
import DeleteScene from "./DeleteScene.gql";
import UpdateScene from "./UpdateScene.gql";
import AddStudio from "./AddStudio.gql";
import DeleteStudio from "./DeleteStudio.gql";
import UpdateStudio from "./UpdateStudio.gql";
import ApplyEdit from "./ApplyEdit.gql";
import CancelEdit from "./CancelEdit.gql";
import ChangePassword from "./ChangePassword.gql";
import ResetPassword from "./ResetPassword.gql";
import RegenerateAPIKey from "./RegenerateAPIKey.gql";
import GenerateInviteCode from "./GenerateInviteCode.gql";
import GrantInvite from "./GrantInvite.gql";
import RescindInviteCode from "./RescindInviteCode.gql";
import RevokeInvite from "./RevokeInvite.gql";
import EditComment from "./EditComment.gql";
import Vote from "./Vote.gql";
import AddSite from "./AddSite.gql";
import DeleteSite from "./DeleteSite.gql";
import UpdateSite from "./UpdateSite.gql";
import FavoriteStudio from "./FavoriteStudio.gql";
import FavoritePerformer from "./FavoritePerformer.gql";
import DeleteDraft from "./DeleteDraft.gql";

export const useActivateUser = (
  options?: MutationHookOptions<
    ActivateNewUserMutation,
    ActivateNewUserMutationVariables
  >
) => useMutation(ActivateUser, options);

export const useAddUser = (
  options?: MutationHookOptions<AddUserMutation, AddUserMutationVariables>
) => useMutation(AddUser, options);

export const useNewUser = (
  options?: MutationHookOptions<NewUserMutation, NewUserMutationVariables>
) => useMutation(NewUser, options);

export const useUpdateUser = (
  options?: MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>
) => useMutation(UpdateUser, options);

export const useDeleteUser = (
  options?: MutationHookOptions<DeleteUserMutation, DeleteUserMutationVariables>
) => useMutation(DeleteUser, options);

export const useAddCategory = (
  options?: MutationHookOptions<
    AddTagCategoryMutation,
    AddTagCategoryMutationVariables
  >
) => useMutation(AddTagCategory, options);

export const useDeleteCategory = (
  options?: MutationHookOptions<
    DeleteTagCategoryMutation,
    DeleteTagCategoryMutationVariables
  >
) => useMutation(DeleteTagCategory, options);

export const useUpdateCategory = (
  options?: MutationHookOptions<
    UpdateTagCategoryMutation,
    UpdateTagCategoryMutationVariables
  >
) => useMutation(UpdateTagCategory, options);

export const useAddImage = (
  options?: MutationHookOptions<AddImageMutation, AddImageMutationVariables>
) => useMutation(AddImage, options);

export const usePerformerEdit = (
  options?: MutationHookOptions<
    PerformerEditMutation,
    PerformerEditMutationVariables
  >
) => useMutation(PerformerEdit, options);

export const useAddScene = (
  options?: MutationHookOptions<AddSceneMutation, AddSceneMutationVariables>
) => useMutation(AddScene, options);

export const useDeleteScene = (
  options?: MutationHookOptions<
    DeleteSceneMutation,
    DeleteSceneMutationVariables
  >
) => useMutation(DeleteScene, options);

export const useUpdateScene = (
  options?: MutationHookOptions<
    UpdateSceneMutation,
    UpdateSceneMutationVariables
  >
) => useMutation(UpdateScene, options);

export const useAddStudio = (
  options?: MutationHookOptions<AddStudioMutation, AddStudioMutationVariables>
) => useMutation(AddStudio, options);

export const useDeleteStudio = (
  options?: MutationHookOptions<
    DeleteStudioMutation,
    DeleteStudioMutationVariables
  >
) => useMutation(DeleteStudio, options);

export const useUpdateStudio = (
  options?: MutationHookOptions<
    UpdateStudioMutation,
    UpdateStudioMutationVariables
  >
) => useMutation(UpdateStudio, options);

export const useTagEdit = (
  options?: MutationHookOptions<TagEditMutation, TagEditMutationVariables>
) => useMutation(TagEdit, options);

export const useStudioEdit = (
  options?: MutationHookOptions<StudioEditMutation, StudioEditMutationVariables>
) => useMutation(StudioEdit, options);

export const useSceneEdit = (
  options?: MutationHookOptions<SceneEditMutation, SceneEditMutationVariables>
) => useMutation(SceneEdit, options);

export const useApplyEdit = (
  options?: MutationHookOptions<ApplyEditMutation, ApplyEditMutationVariables>
) => useMutation(ApplyEdit, options);

export const useCancelEdit = (
  options?: MutationHookOptions<CancelEditMutation, CancelEditMutationVariables>
) => useMutation(CancelEdit, options);

export const useChangePassword = (
  options?: MutationHookOptions<
    ChangePasswordMutation,
    ChangePasswordMutationVariables
  >
) => useMutation(ChangePassword, options);

export const useResetPassword = (
  options?: MutationHookOptions<
    ResetPasswordMutation,
    ResetPasswordMutationVariables
  >
) => useMutation(ResetPassword, options);

export const useRegenerateAPIKey = (
  options?: MutationHookOptions<
    RegenerateApiKeyMutation,
    RegenerateApiKeyMutationVariables
  >
) => useMutation(RegenerateAPIKey, options);

export const useGenerateInviteCode = (
  options?: MutationHookOptions<GenerateInviteCodeMutation>
) => useMutation(GenerateInviteCode, options);

export const useGrantInvite = (
  options?: MutationHookOptions<
    GrantInviteMutation,
    GrantInviteMutationVariables
  >
) => useMutation(GrantInvite, options);

export const useRescindInviteCode = (
  options?: MutationHookOptions<
    RescindInviteCodeMutation,
    RescindInviteCodeMutationVariables
  >
) => useMutation(RescindInviteCode, options);

export const useRevokeInvite = (
  options?: MutationHookOptions<
    RevokeInviteMutation,
    RevokeInviteMutationVariables
  >
) => useMutation(RevokeInvite, options);

export const useEditComment = (
  options?: MutationHookOptions<
    EditCommentMutation,
    EditCommentMutationVariables
  >
) => useMutation(EditComment, options);

export const useVote = (
  options?: MutationHookOptions<VoteMutation, VoteMutationVariables>
) => useMutation(Vote, options);

export const useAddSite = (
  options?: MutationHookOptions<AddSiteMutation, AddSiteMutationVariables>
) => useMutation(AddSite, options);

export const useDeleteSite = (
  options?: MutationHookOptions<DeleteSiteMutation, DeleteSiteMutationVariables>
) => useMutation(DeleteSite, options);

export const useUpdateSite = (
  options?: MutationHookOptions<UpdateSiteMutation, UpdateSiteMutationVariables>
) => useMutation(UpdateSite, options);

export const useSetFavorite = <T extends "performer" | "studio">(
  type: T,
  id: string
) =>
  useMutation<
    T extends "performer" ? FavoritePerformerMutation : FavoriteStudioMutation,
    T extends "performer"
      ? FavoritePerformerMutationVariables
      : FavoriteStudioMutationVariables
  >(type === "performer" ? FavoritePerformer : FavoriteStudio, {
    update: (cache, { errors }) => {
      if (errors === undefined) {
        const identity = cache.identify({
          __typename: type === "performer" ? "Performer" : "Studio",
          id,
        });
        cache.modify({
          id: identity,
          fields: {
            is_favorite: (prevState) => !prevState,
          },
        });
      }
    },
  });

export const useDeleteDraft = (
  options?: MutationHookOptions<
    DeleteDraftMutation,
    DeleteDraftMutationVariables
  >
) => useMutation(DeleteDraft, options);
