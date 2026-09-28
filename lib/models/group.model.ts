/**
 * group.model.ts
 * Mirrors the `groups` and `group_members` table rows.
 */

export interface GroupModel {
  id: string;
  name: string;
  created_by: string; // user_id
  created_at: string;
}

export interface GroupMemberModel {
  id: string;
  group_id: string;
  user_id: string | null; // null if external (non-app) member
  display_name: string;
  avatar_color: string;
  is_external: boolean;
  created_at: string;
}

/** Convenience: group with its members pre-joined */
export interface GroupWithMembers extends GroupModel {
  members: GroupMemberModel[];
}
