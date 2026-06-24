export interface InkClassConfig {
  alias?: string[];
  height?: string;
  width?: string;
  background?: string;
  colors?: string[];
  defaultColor?: string;
  defaultStrokeWidth?: number;
}

export interface InkClassConfigFile {
  classes: Record<string, InkClassConfig>;
}
