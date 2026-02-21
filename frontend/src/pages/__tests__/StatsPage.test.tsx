import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StatsPage from "../StatsPage";
import api from "../../api/client";

vi.mock("../../api/client", () => ({ default: { get: vi.fn() } }));

// The actual StatsPage uses this interface:
// total, monthly, language_ratio, top_authors, most_read_books, streak (number)
const mockStats = {
  total: 20,
  monthly: [{ month: "2026-02", count: 5 }],
  language_ratio: {},
  top_authors: [],
  most_read_books: [],
  streak: 7,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <StatsPage />
    </MemoryRouter>
  );
}

describe("StatsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: mockStats });
  });

  it("renders without crashing", async () => {
    renderPage();
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it("calls api.get for stats", async () => {
    renderPage();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/stats/detail");
    });
  });

  it("shows total books count", async () => {
    const { getByText } = renderPage();
    await waitFor(() => {
      expect(getByText("20")).toBeInTheDocument();
    });
  });
});
