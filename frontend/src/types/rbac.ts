export interface Role {
  id: number;
  name: string;
  permissions: string[];
  users_count?: number;
}

export interface Permission {
  id: number;
  name: string;
}
