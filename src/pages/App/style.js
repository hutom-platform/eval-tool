import { styled } from "@stitches/react";

export const ClickableTd = styled("td", {
  cursor: "pointer",
  color: "blue",
  textDecoration: "underline",
});

export const ScrollableSection = styled("section", {
  maxHeight: "100px",
  overflow: "scroll",
  color: "DarkGray",
  margin: "30px 0",
  fontSize: "0.9rem",
});

export const Page = styled("div", {
  padding: "30px",
});
