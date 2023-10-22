import { SceneCreditType } from 'src/graphql';

type Credit<T> = {
  type: SceneCreditType;
  as?: string | null;
  performer: T;
}
type CreditRecord<T> = Record<keyof typeof SceneCreditType, Credit<T>[]>;

export const parseCredits = <T>(credits: Credit<T>[] | null | undefined): CreditRecord<T> => (
  (credits ?? []).reduce((result, credit) => ({
      ...result,
      [credit.type]: [
        ...(result[credit.type] ?? []),
        credit,
      ]
  }), {} as CreditRecord<T>)
);
