import { RoleGroups } from '../common/constants/roles.constant';

// ✅ Chỉ khai báo những nhóm cần role cụ thể
export const RolePrefixEntries = [
  {
    prefixes: ['/hosts'],
    roles: RoleGroups.HOST_OR_ADMIN,
  },
  {
    prefixes: ['/admin'],
    roles: RoleGroups.ADMIN_ONLY,
  },
] as const;

// ✅ Convert sang map để guard lookup
export const RolePrefixMap: Record<string, string[]> = RolePrefixEntries.reduce(
  (acc, { prefixes, roles }) => {
    for (const p of prefixes) acc[p] = roles;
    return acc;
  },
  {} as Record<string, string[]>,
);
