// src/app/actions.ts
"use server";

import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/utils/cache";

export async function revalidateUnitDataAction(unitId: string | number) {
  revalidateTag(CACHE_TAGS.UNIT);
  revalidateTag(CACHE_TAGS.UNIT_LIST);
  revalidateTag(`${CACHE_TAGS.UNIT}-${unitId}`);
}
