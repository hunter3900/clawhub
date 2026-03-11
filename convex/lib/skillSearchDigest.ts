import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

/** Fields stored in the skillSearchDigest table. */
export type SkillSearchDigestFields = {
  skillId: Id<'skills'>
  slug: string
  displayName: string
  summary?: string
  ownerUserId: Id<'users'>
  canonicalSkillId?: Id<'skills'>
  forkOf?: Doc<'skills'>['forkOf']
  latestVersionId?: Id<'skillVersions'>
  tags: Doc<'skills'>['tags']
  badges?: Doc<'skills'>['badges']
  stats: Doc<'skills'>['stats']
  statsDownloads?: number
  statsStars?: number
  statsInstallsCurrent?: number
  statsInstallsAllTime?: number
  softDeletedAt?: number
  moderationStatus?: Doc<'skills'>['moderationStatus']
  moderationFlags?: string[]
  moderationReason?: string
  isSuspicious?: boolean
  createdAt: number
  updatedAt: number
}

/** Pick the subset of fields from a full skill doc needed for the digest. */
export function extractDigestFields(skill: Doc<'skills'>): SkillSearchDigestFields {
  return {
    skillId: skill._id,
    slug: skill.slug,
    displayName: skill.displayName,
    summary: skill.summary,
    ownerUserId: skill.ownerUserId,
    canonicalSkillId: skill.canonicalSkillId,
    forkOf: skill.forkOf,
    latestVersionId: skill.latestVersionId,
    tags: skill.tags,
    badges: skill.badges,
    stats: skill.stats,
    statsDownloads: skill.statsDownloads,
    statsStars: skill.statsStars,
    statsInstallsCurrent: skill.statsInstallsCurrent,
    statsInstallsAllTime: skill.statsInstallsAllTime,
    softDeletedAt: skill.softDeletedAt,
    moderationStatus: skill.moderationStatus,
    moderationFlags: skill.moderationFlags,
    moderationReason: skill.moderationReason,
    isSuspicious: skill.isSuspicious,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  }
}

/** Insert or update the digest row for a skill. */
export async function upsertSkillSearchDigest(
  ctx: Pick<MutationCtx, 'db'>,
  fields: SkillSearchDigestFields,
) {
  const existing = await ctx.db
    .query('skillSearchDigest')
    .withIndex('by_skill', (q) => q.eq('skillId', fields.skillId))
    .unique()
  if (existing) {
    await ctx.db.patch(existing._id, fields)
  } else {
    await ctx.db.insert('skillSearchDigest', fields)
  }
}

/** Read the full skill doc and sync its digest (convenience wrapper). */
export async function syncSkillSearchDigest(
  ctx: Pick<MutationCtx, 'db'>,
  skillId: Id<'skills'>,
) {
  const skill = await ctx.db.get(skillId)
  if (!skill) return
  await upsertSkillSearchDigest(ctx, extractDigestFields(skill))
}
