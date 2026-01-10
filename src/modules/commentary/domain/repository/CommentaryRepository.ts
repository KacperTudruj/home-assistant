import { Commentary } from "../entity/Commentary";

export interface CommentaryRepository {
  find(params: {
    featureKey: string;
    tags?: string[];
    commentatorId: string;
  }): Promise<Commentary[]>;

  save(commentary: Commentary): Promise<void>;
}
