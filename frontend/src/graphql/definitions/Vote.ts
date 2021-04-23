/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { EditVoteInput, VoteTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: Vote
// ====================================================

export interface Vote_editVote_votes_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface Vote_editVote_votes {
  __typename: "EditVote";
  vote: VoteTypeEnum;
  user: Vote_editVote_votes_user;
  date: any;
}

export interface Vote_editVote {
  __typename: "Edit";
  id: string;
  /**
   *  = Accepted - Rejected
   */
  vote_count: number;
  votes: Vote_editVote_votes[];
}

export interface Vote {
  /**
   * Vote to accept/reject an edit
   */
  editVote: Vote_editVote;
}

export interface VoteVariables {
  input: EditVoteInput;
}
