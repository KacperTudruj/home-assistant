import { Commentary } from "./entity/Commentary";

export class CommentaryPresenter {
  present(commentaries: Commentary[]): Commentary | null {
    if (commentaries.length === 0) return null;

    const index = Math.floor(Math.random() * commentaries.length);
    return commentaries[index];
  }
}
