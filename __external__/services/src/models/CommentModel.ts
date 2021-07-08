export interface CommentModel {
  id: string;
  message: string;
  createdAt: Date;
  user: {
    id: string;
    type: string;
    name: string;
    organisationUnit?: {
      id: string;
      name: string;
    };
  };
  notifications?: {
    count: number;
  };
  replies?: CommentModel[];
}
