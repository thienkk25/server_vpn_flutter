export interface ServerEntity {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  name: string;
  region: string;
  ip: string;
  config: string;
  username: string;
  password?: string;
  version: number;
  status: number;
  onWireGuard: number;
  wireGuardConfig?: string;
}
