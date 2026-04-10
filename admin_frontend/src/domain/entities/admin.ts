export interface ServerEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
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

export interface UserEntity {
    uid: string;
    email: string;
    displayName: string;
    creationTime: string;
}

export interface SettingsEntity {
    maintenanceMode: boolean;
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    systemMessage: string;
    flashSaleEndDate?: string | null;
}
