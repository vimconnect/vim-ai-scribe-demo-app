import { useCallback, useEffect, useMemo, useState } from "react";
import type { Encounter } from "@vimconnect/app-sdk";
import { useVimSdkContext } from "@/providers/VimSdkContext";

/** Encounter sections this app writes. Each field verified against the collection. */
export type EncounterSection = "subjective" | "objective" | "assessment" | "plan";

type SectionField<S extends EncounterSection> = keyof NonNullable<Encounter[S]>;

/**
 * `@vimconnect/app-sdk` types `ehr.context.encounter` as `ContextWriteback`, whose
 * `getCapability('update')` takes no field argument — availability is per entity, not per
 * field. So the priority list only chooses which field to WRITE, not whether the
 * section is writable at all.
 *
 * Field-scoped capability exists on core-sdk's `ContextWritebackNamespace`; it is not
 * reachable through app-sdk's exported types in 0.4.58. Revisit if that changes.
 */
export const useUpdateEncounterSubscription = <S extends EncounterSection>(
  sectionName: S,
  priorityList: Array<SectionField<S>>
) => {
  const vimSdk = useVimSdkContext();
  const [canUpdate, setCanUpdate] = useState(false);

  useEffect(
    () =>
      vimSdk.ehr.context.getUpdatableEntities((entities) =>
        setCanUpdate(Boolean(entities.encounter))
      ),
    [vimSdk]
  );

  const targetField = priorityList[0];

  const updateSubscriptionField = useCallback(
    async (content: string) => {
      if (!targetField || !canUpdate) return;

      const encounter = vimSdk.ehr.context.encounter;
      const fieldPath = `${sectionName}.${String(targetField)}`;

      const capability = encounter.getCapability("update");
      if (!capability.available) {
        console.warn("encounter writeback unavailable", capability.reason);
        return;
      }

      if (!encounter.hasPermission("update")) {
        if (capability.permissionState === "denied") return;
        const granted = await encounter.requestPermission("update", {
          fields: [fieldPath],
        });
        if (granted !== "granted") return;
      }

      try {
        const result = await encounter.update(
          { [sectionName]: { [targetField]: content } } as Partial<Encounter>
        );
        // success with no updatedFields means the EHR already held this value.
        console.log({
          title: result.success
            ? "Encounter notes updated!"
            : "Encounter update rejected",
          updatedFields: result.updatedFields ?? [],
        });
      } catch (error) {
        console.log({
          title: "Uh oh! Something went wrong.",
          fieldPath,
          description: error ? JSON.stringify(error) : "An error occurred.",
        });
      }
    },
    [canUpdate, sectionName, targetField, vimSdk]
  );

  return useMemo(
    () => ({
      canUpdateSubscriptionParams: canUpdate,
      subscriptionUpdatableField: targetField,
      updateSubscriptionField,
    }),
    [canUpdate, targetField, updateSubscriptionField]
  );
};
