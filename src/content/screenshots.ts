import { publicUrl } from "@/lib/publicUrl";

export const SCREENSHOTS = {
  dashboard: {
    alt: "Screenshot: Dashboard – Alles auf einen Blick",
    src: publicUrl("screenshots/dashboard.png"),
    src2x: publicUrl("screenshots/dashboard@2x.png"),
    caption: "Alles auf einen Blick."
  },
  subProfile: {
    alt: "Screenshot: Nachunternehmer-Profil – Pflichtnachweise mit nächstem Schritt",
    src: publicUrl("screenshots/sub-profile.png"),
    src2x: publicUrl("screenshots/sub-profile@2x.png"),
    caption: "Pflichtnachweise mit nächstem Schritt."
  },
  uploadMobile: {
    alt: "Screenshot: Upload – Hochladen per Kamera",
    src: publicUrl("screenshots/upload-mobile.png"),
    src2x: publicUrl("screenshots/upload-mobile@2x.png"),
    caption: "Hochladen per Kamera."
  }
} as const;