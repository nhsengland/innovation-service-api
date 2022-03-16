export interface CommentModel {
  id: string;
  message: string;
  createdAt: Date;
  updated_at: Date;
  is_editable: boolean;
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
    data: {
      id: string;
      contextType: string;
      contextId: string;
      innovationId: string;
      readAt: string;
    }[];
  };
  replies?: CommentModel[];
}
