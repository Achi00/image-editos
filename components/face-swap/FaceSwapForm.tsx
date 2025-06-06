"use client";
import React, { memo, useEffect, useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { FormFields } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { CircleAlert, CircleX, Images, Info, Loader2, X } from "lucide-react";
import { useFaceSwap } from "@/hooks/useFaceSwap";
import GalleryToggle from "./GalleryToggle";
import {
  useImageActions,
  useImageStore,
  useSelectedBackgroundSourceUrl,
  useSelectedSourceId,
  useSelectedTargetId,
} from "@/store/useImageSelectionStore";
import { galleryImages, imagesArr } from "@/lib/images";
import { getImageById } from "@/utils/GetImageById";
import ImageTabs from "./tabs/ImageTabs";
import ReusableAlert from "../ReusableAlert";
import { getFileExtension } from "@/lib/getFileExtension";
import DownloadButton from "../DownloadButton";
import ResponsiveCard from "../ReusableHoverCard";
import { useErrorStore } from "@/store/useErrorStore";
import { useSaveImage } from "@/hooks/useSaveImage";
import { useSubmitText } from "@/hooks/useSubmitText";
import SdImageSelected from "./SdImageSelected";
import { useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
// import { useRouter } from "next/navigation";
const FaceSwapForm = () => {
  // set face swap image as url in params
  const searchParams = useSearchParams();
  // const pathname = usePathname();
  // const router = useRouter();
  // Remove the image state and use URL instead
  const imageFromParams = searchParams.get("faceSwapImage");

  // store image url
  const [image, setImage] = useState<string | null>();
  // performe face swap and upload image into cloudinary
  const { mutateAsync, isPending } = useFaceSwap();
  // save image url, function will decide where to save image url, local storage or database
  const { saveImageData } = useSaveImage();

  // loading text
  const { loadingText } = useSubmitText(isPending);
  // zustand store error
  const error = useErrorStore((state) => state.error);
  const clearError = useErrorStore((state) => state.clearError);

  // from zustand store target(face) image id
  const selectedTargetId = useSelectedTargetId();
  // background image where face will be placed
  const selectedBackgroundSourceId = useSelectedSourceId();
  const { setSelectedTargetFaceId } = useImageActions();

  // if user generated image with stable diffusion
  const selectedBackgroundUrl = useSelectedBackgroundSourceUrl();

  // pass image url to download api
  const { setImageUrl } = useImageStore();

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // return selected face image if selected image id != null
  let selectedFaceImage: string = "";
  if (selectedTargetId !== null) {
    selectedFaceImage = getImageById(selectedTargetId, galleryImages);
  }
  // return selected background source
  let selectedBgImage: string = "";
  // if we have stable diffusion generated image use it as background image or use seleted image
  if (selectedBackgroundUrl) {
    selectedBgImage = selectedBackgroundUrl;
  } else if (selectedBackgroundSourceId) {
    selectedBgImage = getImageById(selectedBackgroundSourceId, imagesArr);
  }

  // check if image state changes and pass to zustand store
  useEffect(() => {
    if (image) {
      setImageUrl(image);
    }
  }, [image, setImageUrl]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormFields>();

  // check if user uploads there file and remove
  const userImage = useWatch({ control, name: "user_image" });
  const hasUserImage = Boolean(userImage?.[0]);

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    clearError();
    try {
      // Handle both cases: uploaded file OR gallery image
      let userImageFile: File;
      if (selectedTargetId !== null) {
        // Convert public image path to File object
        const publicImagePath = getImageById(selectedTargetId, galleryImages);
        const response = await fetch(publicImagePath);
        const blob = await response.blob();
        userImageFile = new File([blob], `gallery-image-${selectedTargetId}`, {
          type: blob.type,
        });
      } else {
        // user uploaded image
        const userInputFile = data.user_image[0];
        userImageFile = new File(
          [userInputFile],
          `user-upload-${Date.now()}${getFileExtension(
            userInputFile?.name || Math.random().toString()
          )}`,
          {
            type: userInputFile?.type || "image/jpeg", // Fallback type
            lastModified: Date.now(),
          }
        );
      }

      const resUrl = await mutateAsync({
        // users image
        target_image: userImageFile,
        // image where face will be moved
        source_image: selectedBgImage,
        operation: "swap-face",
      });
      setImage(resUrl);

      saveImageData(resUrl, "face-swap");
      // set image url as params
      // router.push(`${pathname}?faceSwapImage=${encodeURIComponent(resUrl)}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center flex-col w-full">
      <Toaster />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-md mx-auto mt-10 space-y-6"
      >
        {error && (
          <ReusableAlert
            className="my-4 text-red-600 border-red-500"
            icon={<CircleX className="h-5 w-5" />}
            title="There was problem processing your image"
            content={error}
          />
        )}
        <div className="w-80"></div>
        <div className="flex flex-col gap-4">
          <ReusableAlert
            className="my-4 border-yellow-500"
            icon={<CircleAlert className="h-5 w-5 text-yellow-500" />}
            title="Keep In Mind!"
            content={
              <>
                Usually first request takes longer, about{" "}
                <span className="font-bold">45 seconds</span>.
                <br />
                After first requests it takes about{" "}
                <span className="font-bold">15 seconds</span>
              </>
            }
          />
          <ReusableAlert
            className="my-4"
            icon={<Images className="h-5 w-5" />}
            title="Upload Image select one from gallery"
            content={
              <>
                If you dont want to upload your image, you can select one from
                our gallery by{" "}
                <span className="font-semibold">switching toggle</span> below,
                this image will be selected as{" "}
                <span className="font-semibold">Target Face</span>
              </>
            }
          />
          {/* toggle gallery */}
          <GalleryToggle />
          <ResponsiveCard
            contentClassName="w-80"
            trigger={
              <div className="flex items-center gap-2 pt-2 cursor-pointer hover:underline-offset-2">
                <Info className="cursor-pointer w-5 h-5" />
                <p>What is target face?</p>
              </div>
            }
            content={
              <div className="flex justify-between space-x-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">
                    What is Target face?
                  </h4>
                  <p className="text-sm">
                    Target face it type of image where we get the face from,
                    after this selection we will moved that face to main image
                    which you can select below on{" "}
                    <span className="font-semibold">Select Image</span> section
                    or generate a new one with{" "}
                    <span className="font-semibold">Stable Diffusion</span>
                  </p>
                </div>
              </div>
            }
          />

          {selectedTargetId === null ? (
            <Input
              id="user_image"
              type="file"
              accept="image/*"
              {...register("user_image", {
                onChange: (e) => {
                  if (e.target.files?.[0]) {
                    toast.success("Target image uploaded!");
                  }
                },
              })}
              className="mt-2 block w-full cursor-pointer"
            />
          ) : (
            // show selected image
            <div className="relative w-[250px] h-[250px] flex flex-col gap-3">
              <Image
                quality={70}
                className="rounded-xl border-4 border-blue-500"
                src={selectedFaceImage}
                alt="selected img"
                width={250}
                height={250}
              />
              <div
                className="absolute z-20 top-2 right-2 bg-gray-500 rounded-full p-1 cursor-pointer m-2"
                onClick={() => setSelectedTargetFaceId(null)}
              >
                <X className="text-white w-4 h-4" />
              </div>
              <div className="">
                <h4 className="text-xl font-semibold tracking-tight">
                  Target Face
                </h4>
              </div>
            </div>
          )}
          {errors.user_image && (
            <p className="text-red-500 mt-1 text-sm">
              {errors.user_image.message}
            </p>
          )}
        </div>
        <div className="pt-10">
          {selectedBackgroundUrl && <SdImageSelected isPending={isPending} />}
        </div>
        <div className="pt-16">
          <Button
            type="submit"
            className={`w-full flex items-center gap-2 ${
              (isPending ||
                (selectedTargetId === null && !hasUserImage) ||
                (selectedBackgroundSourceId === null &&
                  selectedBackgroundUrl === null)) &&
              "bg-gray-500"
            }`}
            disabled={
              isPending ||
              (selectedTargetId === null && !hasUserImage) ||
              (selectedBackgroundSourceId === null &&
                selectedBackgroundUrl === null)
            }
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                {loadingText}
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
      {/* final result */}
      {(image || imageFromParams) && (
        <div className="flex flex-col gap-5 text-center py-4">
          <h1 className="font-bold text-3xl">Final Result</h1>
          <Image
            quality={80}
            className="rounded-3xl"
            src={image || imageFromParams || ""}
            alt="final result"
            width={550}
            height={550}
          />
          <DownloadButton />
        </div>
      )}

      <div className="flex flex-col pt-5 items-center gap-8">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Select image or generate new with Stable Diffusion
        </h2>
        <ReusableAlert
          className="w-full"
          icon={<Info className="h-4 w-4" />}
          title="Main Image"
          content={
            <>
              Selected image from this section will be used as main image, where{" "}
              <span className="font-semibold">Target Face</span> will be placed
            </>
          }
        />
        <ImageTabs />
      </div>
    </div>
  );
};

export default memo(FaceSwapForm);
