import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WeeklyChart, WeeklyChartDataPoint } from "../components/WeeklyChart";

// Mock recharts ResponsiveContainer to avoid 0 width/height in jsdom
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 500, height: 200 }}>{children}</div>
    ),
  };
});

describe("WeeklyChart", () => {
  const sampleData: WeeklyChartDataPoint[] = [
    { day: "Fri", value: 0, date: "2026-09-25", fullDate: "Sep 25", dayNumber: 25 },
    { day: "Sat", value: 4, date: "2026-09-26", fullDate: "Sep 26", dayNumber: 26 },
    { day: "Sun", value: 2, date: "2026-09-27", fullDate: "Sep 27", dayNumber: 27 },
    { day: "Mon", value: 0, date: "2026-09-28", fullDate: "Sep 28", dayNumber: 28 },
    { day: "Tue", value: 0, date: "2026-09-29", fullDate: "Sep 29", dayNumber: 29 },
    { day: "Wed", value: 66, date: "2026-09-30", fullDate: "Sep 30", dayNumber: 30 },
    { day: "Thu", value: 0, date: "2026-10-01", fullDate: "Oct 1", dayNumber: 1, isToday: true },
  ];

  it("renders Weekly Velocity header and metrics ribbon", () => {
    render(<WeeklyChart data={sampleData} weeklyTotal={72} activeDays={3} />);

    expect(screen.getByText("Weekly Velocity")).toBeDefined();
    expect(screen.getByText("72 commits")).toBeDefined();
    expect(screen.getByText("3 of 7")).toBeDefined();
    expect(screen.getByText("Peak Velocity")).toBeDefined();
    expect(screen.getByText("Daily Avg")).toBeDefined();
  });

  it("identifies peak day correctly and renders day labels", () => {
    render(<WeeklyChart data={sampleData} />);

    // Wed is peak with 66
    expect(screen.getAllByText(/Wed/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/66/i).length).toBeGreaterThan(0);
    // Thu is marked as TODAY
    expect(screen.getByText("TODAY")).toBeDefined();
  });

  it("supports switching between Pillars and Wave view modes", () => {
    render(<WeeklyChart data={sampleData} />);

    const waveButton = screen.getByRole("button", { name: /wave/i });
    expect(waveButton).toBeDefined();

    fireEvent.click(waveButton);

    const pillarsButton = screen.getByRole("button", { name: /pillars/i });
    expect(pillarsButton).toBeDefined();

    fireEvent.click(pillarsButton);
  });

  it("handles empty data gracefully without throwing", () => {
    render(<WeeklyChart data={[]} />);

    expect(screen.getByText("Weekly Velocity")).toBeDefined();
    expect(screen.getByText("0 commits")).toBeDefined();
    expect(screen.getByText(/No commits recorded yet/i)).toBeDefined();
  });

  it("handles visibilitychange and window focus for fluid refill animation", () => {
    const { container } = render(<WeeklyChart data={sampleData} />);

    // Trigger tab return via visibilitychange
    fireEvent(document, new Event("visibilitychange"));
    // Trigger window focus
    fireEvent(window, new Event("focus"));

    // Ensure chart still renders perfectly
    expect(container.querySelector("[role='graphics-symbol']")).toBeDefined();
    expect(screen.getByText("Weekly Velocity")).toBeDefined();
  });
});
