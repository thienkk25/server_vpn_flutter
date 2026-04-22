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

export interface SettingsEntity {
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    privacyPolicyContent?: string;
    termsOfServiceContent?: string;
}
