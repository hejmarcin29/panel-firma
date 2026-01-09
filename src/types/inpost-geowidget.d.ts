import type * as React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "inpost-geowidget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          token?: string;
          config?: string;
          language?: string;
          onpoint?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
