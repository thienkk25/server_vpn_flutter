export interface ServerEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
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
  isVip?: number;
}
