"use client";
import React, { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./ui/button";
import { CircleX, FolderOpen, ImageIcon, Images, Info } from "lucide-react";
import useLocalStorageStore from "@/store/useLocalStorageStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocalStorageImages } from "@/hooks/useLocalStorageImages";
import { useSession } from "next-auth/react";
import { ImageSection } from "./ImageSection";

const YourImages = () => {
  const { data: session } = useSession();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // stete to check if the image added
  const [showNotification, setShowNotification] = useState(false);
  // get images from zustand selector for memoization
  const images = useLocalStorageStore((state) => state.images);

  // show message when new image is added
  useEffect(() => {
    setShowNotification((prev) => (!prev ? true : false));
  }, [images]);

  // check if image modal is open and close popover
  // get image url from modal url
  const searchParams = useSearchParams();
  const modalUrl = searchParams.get("modal");

  useEffect(() => {
    // close popover
    if (modalUrl !== null) {
      setIsPopoverOpen(false);
    }
  }, [modalUrl]);

  // get images from local storage
  const { removeBgImages, faceSwapImages, upscaleImages } =
    useLocalStorageImages();
  // if user is authenticated dont return component
  if (session) return null;
  return (
    <>
      {/* show notification if new image have been added */}
      {showNotification && <NewImagePopover />}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button className="w-44" variant="outline">
            {isPopoverOpen ? (
              <>
                <CircleX /> Close Gallery
              </>
            ) : (
              <>
                <Images /> Open Your Gallery
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[100vw] sm:w-[500px]"
          side="top"
          align="center"
          sideOffset={5}
        >
          <div className="p-4 bg-muted">
            <h4 className="font-medium">Recent Images</h4>
          </div>
          <Tabs className="w-full max-w-3xl mx-auto">
            <TabsList className="flex items-center justify-center flex-col xl:flex-row lg:flex-row sm:flex-row mt-10 gap-2 p-1 mb-20">
              <TabsTrigger value="remove-bg">Remove BG</TabsTrigger>
              <TabsTrigger value="face-swap">Face Swap</TabsTrigger>
              <TabsTrigger value="upscale">Upscale</TabsTrigger>
            </TabsList>

            <TabsContent value="remove-bg">
              {removeBgImages.length > 0 ? (
                <ImageSection
                  className="grid xl:grid-cols-2 sm:grid-cols-1 gap-2 max-h-96 overflow-auto p-2"
                  images={removeBgImages}
                  title="Background Removed"
                />
              ) : (
                <NoContent sectionName="Remove Background" />
              )}
            </TabsContent>

            <TabsContent value="face-swap">
              {faceSwapImages.length > 0 ? (
                <ImageSection
                  className="grid xl:grid-cols-2 sm:grid-cols-1 gap-2 max-h-96 overflow-auto p-2"
                  images={faceSwapImages}
                  title="Face Swapped"
                />
              ) : (
                <NoContent sectionName="Face Swap" />
              )}
            </TabsContent>

            <TabsContent value="upscale">
              {upscaleImages.length > 0 ? (
                <ImageSection
                  className="grid xl:grid-cols-2 sm:grid-cols-1 gap-2 max-h-96 overflow-auto p-2"
                  images={upscaleImages}
                  title="Upscale"
                />
              ) : (
                <NoContent sectionName="Upscale Image" />
              )}
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </>
  );
};

// if there are no images on any section
export const NoContent = ({ sectionName }: { sectionName: string }) => (
  <Card className="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle className="flex items-center text-xl font-semibold text-gray-700">
        <FolderOpen className="mr-2 h-6 w-6 text-yellow-500" />
        No Content Available
      </CardTitle>
      <CardDescription>This section is currently empty</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col items-center text-center space-y-4">
        <ImageIcon className="h-24 w-24 text-gray-400" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-600">
            You do not have any images in the{" "}
            <span className="font-bold text-primary">{sectionName}</span>{" "}
            section
          </p>
          <p className="text-sm text-gray-500">
            You can do {sectionName} process by navigating to{" "}
            <Link
              className="text-blue-800 underline font-semibold"
              href={
                sectionName === "Face Swap"
                  ? "face-swap"
                  : sectionName === "Remove Background"
                  ? "remove-bg"
                  : "upscale"
              }
            >
              {sectionName} page
            </Link>{" "}
            and start processing the image
          </p>
        </div>
        <div className="flex items-start bg-blue-50 text-blue-700 p-4 rounded-lg mt-4 w-full">
          <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm">Your processed images will appare here</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// show popover whenever new image is saved in local storage
const NewImagePopover = () => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <Card className="w-44 mb-5">
      <div className="flex flex-col items-start bg-blue-50 text-blue-700 p-4 rounded-lg w-full">
        <div className="flex items-center gap-1 py-2 pb-4">
          <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">New image added!</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Check it out in your gallery.
        </p>
      </div>
    </Card>
  );
};

export default YourImages;
