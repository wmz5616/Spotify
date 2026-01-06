"use client";

import React from "react";
import { ListMusic } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";

const QueueButton = () => {
  const { isQueueOpen, toggleQueue } = usePlayerStore();

  return (
    <button
      onClick={toggleQueue}
      className={`transition ${
        isQueueOpen ? "text-green-500" : "text-neutral-400"
      } hover:text-white`}
      title="Queue"
    >
      <ListMusic size={18} />
    </button>
  );
};

export default QueueButton;
