import type { Area } from "react-easy-crop";

import { PROFILE_AVATAR_OUTPUT_SIZE } from "@/lib/profiles/profile-media";

function loadImage(imageSrc: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Unable to load selected image."))
    );
    image.src = imageSrc;
  });
}

export async function createCroppedAvatarFile(imageSrc: string, pixelCrop: Area) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = PROFILE_AVATAR_OUTPUT_SIZE;
  canvas.height = PROFILE_AVATAR_OUTPUT_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to prepare the avatar image.");
  }

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    PROFILE_AVATAR_OUTPUT_SIZE,
    PROFILE_AVATAR_OUTPUT_SIZE
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.92);
  });

  if (!blob) {
    throw new Error("Unable to export the cropped avatar image.");
  }

  return new File([blob], "avatar.webp", { type: "image/webp" });
}
