"use client";
import { useCallback } from "react";
import useLocalStorageStore from "@/store/useLocalStorageStore";
import { useSession } from "next-auth/react";
import { SaveImageInDb } from "@/utils/SaveImageInDb";

export function useSaveImage() {
  const { addImage } = useLocalStorageStore();
  const { data: session } = useSession();

  const saveImageData = useCallback(
    async (
      imageUrl: string,
      imageFrom: "face-swap" | "remove-bg" | "upscale"
    ) => {
      if (!imageUrl) {
        throw new Error("No image to save");
      }

      try {
        if (!session) {
          console.log("User not authenticated, saving to localStorage");
          addImage({
            imageFrom: imageFrom,
            date: new Date(),
            imgUrl: imageUrl,
          });
        } else {
          console.log("User authenticated, saving to database");
          await SaveImageInDb({ imageFrom, imageUrl });
        }
      } catch (error) {
        console.error("Error saving image:", error);
      }
    },
    [session, addImage]
  );

  return { saveImageData };
}
