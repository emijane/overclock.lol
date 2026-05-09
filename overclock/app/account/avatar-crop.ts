import { PROFILE_AVATAR_OUTPUT_SIZE } from "@/lib/profiles/profile-media";

export async function createCroppedAvatarFile(sourceCanvas: HTMLCanvasElement) {
  const canvas = document.createElement("canvas");
  canvas.width = PROFILE_AVATAR_OUTPUT_SIZE;
  canvas.height = PROFILE_AVATAR_OUTPUT_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to prepare the avatar image.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, PROFILE_AVATAR_OUTPUT_SIZE, PROFILE_AVATAR_OUTPUT_SIZE);
  context.save();
  context.beginPath();
  context.arc(
    PROFILE_AVATAR_OUTPUT_SIZE / 2,
    PROFILE_AVATAR_OUTPUT_SIZE / 2,
    PROFILE_AVATAR_OUTPUT_SIZE / 2,
    0,
    Math.PI * 2
  );
  context.closePath();
  context.clip();
  context.drawImage(
    sourceCanvas,
    0,
    0,
    PROFILE_AVATAR_OUTPUT_SIZE,
    PROFILE_AVATAR_OUTPUT_SIZE
  );
  context.restore();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.92);
  });

  if (!blob) {
    throw new Error("Unable to export the cropped avatar image.");
  }

  return new File([blob], "avatar.webp", { type: "image/webp" });
}
