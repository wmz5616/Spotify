"use client";

import React from "react";
import Image from "next/image";

interface AboutCardProps {
  bio: string;
  imageUrl?: string;
}

const AboutCard: React.FC<AboutCardProps> = ({ bio, imageUrl }) => {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6">About</h2>
      <div className="relative rounded-lg bg-neutral-900/60 overflow-hidden group hover:bg-neutral-900 transition-colors">
        <div className="flex flex-col md:flex-row h-full">
          {imageUrl && (
            <div className="relative w-full md:w-2/5 h-64 md:h-auto min-h-[300px]">
              <Image
                src={imageUrl}
                alt="Artist Bio"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-neutral-900/60 md:to-neutral-900/90" />
            </div>
          )}
          <div className="p-8 flex-1 flex flex-col justify-center">
            <p className="text-neutral-300 leading-relaxed whitespace-pre-line text-lg max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-neutral-700">
              {bio}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutCard;
