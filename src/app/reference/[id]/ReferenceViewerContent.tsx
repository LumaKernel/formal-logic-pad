"use client";

import { useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { allReferenceEntries } from "../../../lib/reference/referenceContent";
import { resolveEntryById } from "../../../lib/reference/referenceViewerLogic";
import {
  ReferenceViewerPageView,
  ReferenceViewerNotFound,
} from "../../../lib/reference/ReferenceViewerPageView";
import { ThemeProvider } from "../../../lib/theme/ThemeProvider";
import { isLocale } from "../../../components/LanguageToggle/languageToggleLogic";
import type { Locale } from "../../../lib/reference/referenceEntry";

export default function ReferenceViewerContent() {
  const params = useParams();
  const router = useRouter();
  const appLocale = useLocale();

  const entryId =
    typeof params.id === "string" ? decodeURIComponent(params.id) : "";

  const entry = useMemo(
    () => resolveEntryById(allReferenceEntries, entryId),
    [entryId],
  );

  const refLocale: Locale = isLocale(appLocale) ?? "en";

  const handleNavigate = useCallback(
    (targetId: string) => {
      router.push(
        `/reference/${encodeURIComponent(targetId) satisfies string}`,
      );
    },
    [router],
  );

  return (
    <ThemeProvider>
      {entry !== undefined ? (
        <ReferenceViewerPageView
          entry={entry}
          allEntries={allReferenceEntries}
          locale={refLocale}
          onNavigate={handleNavigate}
          testId="reference-viewer"
        />
      ) : (
        <ReferenceViewerNotFound
          locale={refLocale}
          testId="reference-not-found"
        />
      )}
    </ThemeProvider>
  );
}
