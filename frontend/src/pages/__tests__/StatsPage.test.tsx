import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StatsPage from "../StatsPage";
import api from "../../api/client";

vi.mock("../../api/client", () => ({ default: { get: vi.fn() } }));

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

  it("renders page heading", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /독서 통계/i })).toBeInTheDocument();
    });
  });

  it("shows total books count from API data", async () => {
    renderPage();
    await waitFor(() => {
      // mockStats.total === 20
      expect(screen.getByText("20")).toBeInTheDocument();
    });
  });

  it("shows streak count from API data", async () => {
    renderPage();
    await waitFor(() => {
      // mockStats.streak === 7
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });
});
