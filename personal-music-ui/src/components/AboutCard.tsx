"use client";

import React, { useState } from "react";
import Image from "next/image";

interface AboutCardProps {
  bio: string;
  imageUrl: string;
}

const AboutCard = ({ bio, imageUrl }: AboutCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const summary = bio.length > 300 ? bio.substring(0, 300) + "..." : bio;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6">About</h2>
      <div className="relative rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt="Artist biography image"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-transparent" />

        <div className="relative p-8 text-white">
          <p
            className="text-sm leading-relaxed whitespace-pre-line"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ cursor: bio.length > 300 ? "pointer" : "default" }}
          >
            {isExpanded ? bio : summary}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutCard;
