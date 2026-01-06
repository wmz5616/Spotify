import React from "react";

const AlbumPageSkeleton = () => {
  return (
    <div className="p-8 animate-pulse">
      <header className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8 pt-16">
        <div className="w-48 h-48 lg:w-56 lg:h-56 flex-shrink-0 bg-neutral-700 rounded-md shadow-2xl"></div>
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 bg-neutral-700 rounded"></div>
          <div className="h-16 w-80 bg-neutral-700 rounded"></div>
          <div className="h-5 w-48 bg-neutral-700 rounded mt-2"></div>
        </div>
      </header>
      <div className="h-20 mb-8"></div>
      <section>
        <div className="h-8 w-32 bg-neutral-700 rounded mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 w-full bg-neutral-800/50 rounded-md"
            ></div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AlbumPageSkeleton;
