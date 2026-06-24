export function applyStageBackground(stage: HTMLElement, backgroundUrl: string | null, background: string): void {
  stage.style.backgroundImage = "";
  stage.style.backgroundColor = "";
  if (backgroundUrl) {
    stage.style.backgroundImage = `url("${backgroundUrl}")`;
    return;
  }
  if (background.startsWith("#") || background === "white" || background === "black") {
    stage.style.backgroundColor = background === "black" ? "#101014" : background;
  }
}
