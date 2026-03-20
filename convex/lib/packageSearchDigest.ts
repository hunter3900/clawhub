import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(keys.map((key) => [key, obj[key]])) as Pick<T, K>;
}

const SHARED_KEYS = [
  "name",
  "normalizedName",
  "displayName",
  "family",
  "channel",
  "isOfficial",
  "ownerUserId",
  "summary",
  "capabilityTags",
  "executesCode",
  "runtimeId",
  "softDeletedAt",
  "createdAt",
  "updatedAt",
] as const satisfies readonly (keyof Doc<"packages"> & keyof Doc<"packageSearchDigest">)[];

export type PackageSearchDigestFields = Pick<Doc<"packages">, (typeof SHARED_KEYS)[number]> & {
  packageId: Id<"packages">;
  latestVersion?: string;
  ownerHandle?: string;
  verificationTier?: Doc<"packageSearchDigest">["verificationTier"];
};

export function extractPackageDigestFields(pkg: Doc<"packages">): PackageSearchDigestFields {
  return {
    ...pick(pkg, [...SHARED_KEYS]),
    packageId: pkg._id,
    latestVersion: pkg.latestVersionSummary?.version,
    verificationTier: pkg.verification?.tier,
  };
}

export async function upsertPackageSearchDigest(
  ctx: Pick<MutationCtx, "db">,
  fields: PackageSearchDigestFields,
) {
  const existing = await ctx.db
    .query("packageSearchDigest")
    .withIndex("by_package", (q) => q.eq("packageId", fields.packageId))
    .unique();
  if (existing) {
    if (!hasDigestChanged(existing, fields)) return;
    await ctx.db.patch(existing._id, fields);
    return;
  }
  await ctx.db.insert("packageSearchDigest", fields);
}

function hasDigestChanged(
  existing: Doc<"packageSearchDigest">,
  fields: PackageSearchDigestFields,
): boolean {
  for (const key of Object.keys(fields)) {
    const oldValue = (existing as Record<string, unknown>)[key];
    const newValue = (fields as Record<string, unknown>)[key];
    if (oldValue === newValue) continue;
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) return true;
  }
  return false;
}
