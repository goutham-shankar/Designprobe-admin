const ENV_BASE = (process.env.NEXT_PUBLIC_R2_BASE ?? "").replace(/\/+$/, "") || null;

let _r2Base: string | null = ENV_BASE;

export function setR2Base(base: string | null) {
  _r2Base = base ? base.replace(/\/+$/, "") : null;
}

export function getR2Base(): string | null {
  return _r2Base;
}

export function r2Url(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("https://") || key.startsWith("http://")) return key;
  if (!_r2Base) return null;
  return `${_r2Base}/${key.replace(/^\/+/, "")}`;
}
