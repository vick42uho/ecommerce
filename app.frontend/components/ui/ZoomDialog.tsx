"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { XIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import React from "react";

interface ZoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  alt?: string;
}

export function ZoomDialog({ open, onOpenChange, imageUrl, alt }: ZoomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col items-center">
        {/* Visually hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">ดูภาพสลิปขนาดใหญ่</DialogTitle>
        <Button
          variant="ghost"
          className="absolute top-4 right-4 z-10 p-2"
          onClick={() => onOpenChange(false)}
          aria-label="ปิด"
        >
          <XIcon />
        </Button>
        <div className="w-full h-full flex items-center justify-center">
          <Image
            src={imageUrl}
            alt={alt || "ภาพขยาย"}
            width={600}
            height={900}
            className="rounded-lg border max-h-[80vh] object-contain"
            style={{ background: '#fff' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
