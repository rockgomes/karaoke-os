import React from "react";
import { Chip } from "@heroui/react";

const GenrePills = ({ genres, className = "" }) => {
  if (!genres) return null;

  // Parse genres (could be a string with comma-separated values or already an array)
  const genreArray =
    typeof genres === "string"
      ? genres
          .split(",")
          .map((g) => g.trim())
          .filter((g) => g.length > 0)
      : Array.isArray(genres)
      ? genres
      : [genres];

  if (genreArray.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {genreArray.map((genre, index) => (
        <Chip key={index} size="sm" variant="flat" color="primary">
          {genre}
        </Chip>
      ))}
    </div>
  );
};

export default GenrePills;
