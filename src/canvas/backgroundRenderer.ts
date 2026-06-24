export function applyStageBackground(stage: HTMLElement, backgroundUrl: string | null, background: string): void {
  stage.style.backgroundImage = "";
  stage.style.backgroundColor = "";
  stage.style.backgroundSize = "";
  const fallback = getCssBackgroundFallback(background);
  if (backgroundUrl) {
    stage.style.backgroundColor = fallback?.color ?? (background.includes("black") ? "#101014" : "#ffffff");
    stage.style.backgroundImage = fallback?.image ? `url("${backgroundUrl}"), ${fallback.image}` : `url("${backgroundUrl}")`;
    stage.style.backgroundSize = fallback?.size ? `auto, ${fallback.size}` : "";
    return;
  }
  if (fallback) {
    stage.style.backgroundColor = fallback.color;
    stage.style.backgroundImage = fallback.image;
    stage.style.backgroundSize = fallback.size;
    return;
  }
  if (background.startsWith("#") || background === "white" || background === "black") {
    stage.style.backgroundColor = background === "black" ? "#101014" : background;
  }
}

export function getCssBackgroundFallback(background: string): { color: string; image: string; size: string } | null {
  const name = background.split("/").pop()?.toLowerCase();
  if (name === "grid.svg") {
    return {
      color: "#ffffff",
      image: "linear-gradient(#d8d8d8 1px, transparent 1px), linear-gradient(90deg, #d8d8d8 1px, transparent 1px)",
      size: "32px 32px"
    };
  }
  if (name === "axis.svg") {
    return {
      color: "#ffffff",
      image:
        "linear-gradient(#ececec 1px, transparent 1px), linear-gradient(90deg, #ececec 1px, transparent 1px), linear-gradient(#cfd7e6 1.5px, transparent 1.5px), linear-gradient(90deg, #cfd7e6 1.5px, transparent 1.5px)",
      size: "64px 64px, 64px 64px, 64px 64px, 64px 64px"
    };
  }
  if (name === "line.svg") {
    return {
      color: "#ffffff",
      image: "linear-gradient(transparent 27px, #d8e0f0 28px, transparent 29px)",
      size: "64px 32px"
    };
  }
  if (name === "black.svg" || background === "black") {
    return {
      color: "#101014",
      image: "",
      size: ""
    };
  }
  return null;
}
