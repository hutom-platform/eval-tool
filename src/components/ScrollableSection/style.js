import { styled } from "@stitches/react";
import { memo } from "react";

export const ScrollableSection = memo(styled("section", {
  maxHeight: "100px",
  overflow: "scroll",
  color: "DarkGray",
  margin: "30px 0",
  fontSize: "0.9rem",
}));
