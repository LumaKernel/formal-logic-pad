import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  EllipsisOutlined,
  MoreOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
} from "./UiIcons";

describe("UiIcons", () => {
  it("renders EllipsisOutlined", () => {
    render(<EllipsisOutlined aria-hidden={false} />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders MoreOutlined", () => {
    render(<MoreOutlined aria-hidden="true" />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders SunOutlined", () => {
    render(<SunOutlined />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders MoonOutlined", () => {
    render(<MoonOutlined />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders DesktopOutlined", () => {
    render(<DesktopOutlined />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("applies custom style", () => {
    const { container } = render(<EllipsisOutlined style={{ width: "2em" }} />);
    const svg = container.querySelector("svg");
    expect(svg?.style.width).toBe("2em");
  });

  it("uses default style without custom style", () => {
    const { container } = render(<MoonOutlined />);
    const svg = container.querySelector("svg");
    expect(svg?.style.width).toBe("1em");
  });

  it("renders accessible icon with aria-hidden false", () => {
    const { container } = render(
      <span role="img" aria-label="sun">
        <SunOutlined aria-hidden={false} />
      </span>,
    );
    expect(screen.getByRole("img")).toBeInTheDocument();
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("false");
  });
});
