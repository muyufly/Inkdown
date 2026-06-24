import { InkClassConfigFile } from "../types/classConfig";

export const DEFAULT_CLASS_CONFIG: InkClassConfigFile = {
  classes: {
    SysDefault: {
      alias: ["default"],
      height: "4",
      width: "800px",
      background: "./backgrounds/white.svg",
      colors: ["#000000", "#ffffff", "#ff0000"],
      defaultColor: "#000000",
      defaultStrokeWidth: 2
    },
    SysMath: {
      alias: ["m", "math"],
      height: "10",
      width: "100%",
      background: "./backgrounds/grid.svg",
      colors: ["#000000", "#ff0000", "#0066ff"],
      defaultColor: "#000000",
      defaultStrokeWidth: 2
    },
    SysGraph: {
      alias: ["g", "graph"],
      height: "9",
      width: "100%",
      background: "./backgrounds/axis.svg",
      colors: ["#000000", "#ff0000", "#0066ff"],
      defaultColor: "#000000",
      defaultStrokeWidth: 2
    },
    SysQuick: {
      alias: ["q", "quick"],
      height: "4",
      width: "100%",
      background: "./backgrounds/line.svg",
      colors: ["#000000", "#ff0000"],
      defaultColor: "#000000",
      defaultStrokeWidth: 2
    },
    SysDark: {
      alias: ["d", "dark"],
      height: "6",
      width: "100%",
      background: "./backgrounds/black.svg",
      colors: ["#ffffff", "#ff5555", "#00ffff"],
      defaultColor: "#ffffff",
      defaultStrokeWidth: 2
    }
  }
};

export const DEFAULT_CONFIG = {
  height: "4",
  width: "800px",
  background: "white",
  colors: ["#000000", "#ffffff", "#ff0000"],
  defaultColor: "#000000",
  defaultStrokeWidth: 2
};

export const DEFAULT_BACKGROUNDS: Record<string, string> = {
  "white.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#fff"/></svg>`,
  "black.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#101014"/></svg>`,
  "grid.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#fff"/><path d="M32 0H0V32" fill="none" stroke="#d8d8d8" stroke-width="1"/></svg>`,
  "axis.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#fff"/><path d="M32 0V64M0 32H64" stroke="#cfd7e6" stroke-width="1.5"/><path d="M64 0H0V64" fill="none" stroke="#ececec" stroke-width="1"/></svg>`,
  "line.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><rect width="64" height="32" fill="#fff"/><path d="M0 28H64" stroke="#d8e0f0" stroke-width="1.5"/></svg>`
};
