import { DEFAULT_CLASS_CONFIG, DEFAULT_CONFIG } from "./defaultClasses";
import { InkClassConfig, InkClassConfigFile } from "../types/classConfig";
import { InkBlockMeta, ResolvedInkConfig } from "../types/ink";
import { normalizeCssSize, normalizeLineCount } from "../utils/units";

export function resolveAlias(config: InkClassConfigFile, value: string | undefined): string {
  if (!value) return "SysDefault";
  if (config.classes[value]) return value;
  for (const [name, classConfig] of Object.entries(config.classes)) {
    if (classConfig.alias?.includes(value)) return name;
  }
  if (DEFAULT_CLASS_CONFIG.classes[value]) return value;
  for (const [name, classConfig] of Object.entries(DEFAULT_CLASS_CONFIG.classes)) {
    if (classConfig.alias?.includes(value)) return name;
  }
  return value;
}

export function resolveInkConfig(config: InkClassConfigFile, meta: InkBlockMeta): ResolvedInkConfig {
  const className = resolveAlias(config, meta.className);
  const classConfig = config.classes[className] ?? {};
  const systemConfig = DEFAULT_CLASS_CONFIG.classes[className] ?? DEFAULT_CLASS_CONFIG.classes.SysDefault;
  const merged = mergeConfigs(DEFAULT_CONFIG, systemConfig, classConfig);

  return {
    className,
    height: normalizeLineCount(meta.height) ?? normalizeLineCount(merged.height) ?? defaultsHeight(),
    width: normalizeCssSize(meta.width) ?? merged.width,
    background: meta.background ?? merged.background,
    colors: meta.colors ?? merged.colors,
    defaultColor: meta.colors?.[0] ?? merged.defaultColor,
    defaultStrokeWidth: merged.defaultStrokeWidth
  };
}

function defaultsHeight(): string {
  return "4";
}

function mergeConfigs(
  defaults: Required<Omit<InkClassConfig, "alias">>,
  systemConfig: InkClassConfig,
  userConfig: InkClassConfig
): Required<Omit<InkClassConfig, "alias">> {
  return {
    height: userConfig.height ?? systemConfig.height ?? defaults.height,
    width: userConfig.width ?? systemConfig.width ?? defaults.width,
    background: userConfig.background ?? systemConfig.background ?? defaults.background,
    colors: userConfig.colors ?? systemConfig.colors ?? defaults.colors,
    defaultColor: userConfig.defaultColor ?? systemConfig.defaultColor ?? defaults.defaultColor,
    defaultStrokeWidth: userConfig.defaultStrokeWidth ?? systemConfig.defaultStrokeWidth ?? defaults.defaultStrokeWidth
  };
}
