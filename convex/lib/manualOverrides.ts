import type { Doc, Id } from '../_generated/dataModel'
import { type ModerationVerdict, legacyFlagsFromVerdict } from './moderationReasonCodes'
import { computeIsSuspicious } from './skillSafety'

export type ManualOverrideVerdict = Extract<ModerationVerdict, 'clean'>

export type ManualModerationOverride = {
  verdict: ManualOverrideVerdict
  note: string
  reviewerUserId: Id<'users'>
  updatedAt: number
}

type SkillModerationPatch = Partial<
  Pick<
    Doc<'skills'>,
    | 'moderationStatus'
    | 'moderationReason'
    | 'moderationFlags'
    | 'moderationVerdict'
    | 'moderationReasonCodes'
    | 'moderationEvidence'
    | 'moderationSummary'
    | 'moderationEngineVersion'
    | 'moderationEvaluatedAt'
    | 'moderationSourceVersionId'
    | 'isSuspicious'
    | 'hiddenAt'
    | 'hiddenBy'
    | 'lastReviewedAt'
    | 'updatedAt'
  >
>

export function isManualOverrideReason(reason: string | undefined) {
  return typeof reason === 'string' && reason.startsWith('manual.override.')
}

export function buildManualOverrideReason(verdict: ManualOverrideVerdict) {
  return `manual.override.${verdict}`
}

export function formatManualOverrideSummary(override: ManualModerationOverride) {
  return `Manual override (${override.verdict}): ${override.note}`
}

export function applyManualOverrideToSkillPatch(params: {
  basePatch?: SkillModerationPatch
  override: ManualModerationOverride
  now: number
}): SkillModerationPatch {
  if (
    params.basePatch?.moderationVerdict === 'malicious' ||
    params.basePatch?.moderationFlags?.includes('blocked.malware')
  ) {
    return params.basePatch
  }

  const moderationFlags = legacyFlagsFromVerdict(params.override.verdict)
  const moderationReason = buildManualOverrideReason(params.override.verdict)

  return {
    ...params.basePatch,
    moderationStatus: 'active',
    moderationFlags,
    moderationReason,
    moderationVerdict: params.override.verdict,
    moderationSummary: formatManualOverrideSummary(params.override),
    moderationEvaluatedAt: params.override.updatedAt,
    hiddenAt: undefined,
    hiddenBy: undefined,
    lastReviewedAt: params.override.updatedAt,
    isSuspicious: computeIsSuspicious({
      moderationFlags,
      moderationReason,
    }),
    updatedAt: params.now,
  }
}
