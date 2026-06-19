export enum Role {
  User = 1,
  Admin = 2,
}

export const RoleLabels: Record<Role, string> = {
  [Role.User]: "Üye",
  [Role.Admin]: "Mağaza Yöneticisi",
};
