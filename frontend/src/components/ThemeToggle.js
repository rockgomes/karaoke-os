import React from "react";
import { Switch } from "@heroui/react";
import { SunIcon, MoonIcon } from "@heroui/shared-icons";
import { useTheme } from "../contexts/ThemeContext";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Switch
      isSelected={isDark}
      onValueChange={toggleTheme}
      size="md"
      color="primary"
      aria-label="Toggle dark mode"
      thumbIcon={(props) =>
        props?.isSelected ? <MoonIcon {...props} /> : <SunIcon {...props} />
      }
    />
  );
};

export default ThemeToggle;
