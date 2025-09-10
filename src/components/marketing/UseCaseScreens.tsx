import { ScreenshotCard } from "./ScreenshotCard";

interface UseCaseScreensProps {
  keys: Array<"dashboard" | "subProfile" | "uploadMobile">;
}

export function UseCaseScreens({ keys }: UseCaseScreensProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {keys.includes("dashboard") && (
        <ScreenshotCard k="dashboard" title="Dashboard" />
      )}
      {keys.includes("subProfile") && (
        <ScreenshotCard k="subProfile" title="Profil" />
      )}
      {keys.includes("uploadMobile") && (
        <ScreenshotCard k="uploadMobile" title="Upload" />
      )}
    </div>
  );
}