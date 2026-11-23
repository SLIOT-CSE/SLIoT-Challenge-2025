import "react";

// Allow CSS custom properties in style props, e.g. style={{ "--delay": "0.2s" }}
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
