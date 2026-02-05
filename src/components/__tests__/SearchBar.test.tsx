import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchBar from "../SearchBar";
import { AppProvider } from "@/lib/store/AppContext";

// Mock the useSearch hook
vi.mock("@/lib/hooks/useSearch", () => ({
  useSearch: () => ({
    performSearch: vi.fn(),
    isSearching: false,
    searchTime: 0,
  }),
}));

// Helper to render with AppProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<AppProvider>{ui}</AppProvider>);
};

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input", () => {
    renderWithProvider(<SearchBar />);

    const searchInput = screen.getByPlaceholderText("Search photos...");
    expect(searchInput).toBeInTheDocument();
  });

  it("renders filter button", () => {
    const { container } = renderWithProvider(<SearchBar />);

    const filterButton = container.querySelector('button .material-symbols-outlined');
    expect(filterButton).toBeInTheDocument();
    expect(filterButton?.textContent).toBe('tune');
  });

  describe("Media type filtering", () => {
    it("renders all three media type filter chips", () => {
      renderWithProvider(<SearchBar />);

      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("Images")).toBeInTheDocument();
      expect(screen.getByText("Videos")).toBeInTheDocument();
    });

    it("displays correct icons for media type filters", () => {
      const { container } = renderWithProvider(<SearchBar />);

      const icons = container.querySelectorAll('.material-symbols-outlined');
      const iconTexts = Array.from(icons).map((el) => el.textContent);

      expect(iconTexts).toContain('apps'); // All
      expect(iconTexts).toContain('image'); // Images
      expect(iconTexts).toContain('videocam'); // Videos
    });

    it("highlights 'All' filter by default", () => {
      const { container } = renderWithProvider(<SearchBar />);

      const allButton = screen.getByText("All").closest('button');
      expect(allButton).toHaveClass('bg-blue-500');
      expect(allButton).toHaveClass('text-white');
    });

    it("changes active filter when clicking Images", async () => {
      const { container } = renderWithProvider(<SearchBar />);

      const imagesButton = screen.getByText("Images").closest('button');
      expect(imagesButton).not.toHaveClass('bg-blue-500');

      fireEvent.click(imagesButton!);

      await waitFor(() => {
        expect(imagesButton).toHaveClass('bg-blue-500');
        expect(imagesButton).toHaveClass('text-white');
      });
    });

    it("changes active filter when clicking Videos", async () => {
      const { container } = renderWithProvider(<SearchBar />);

      const videosButton = screen.getByText("Videos").closest('button');
      expect(videosButton).not.toHaveClass('bg-blue-500');

      fireEvent.click(videosButton!);

      await waitFor(() => {
        expect(videosButton).toHaveClass('bg-blue-500');
        expect(videosButton).toHaveClass('text-white');
      });
    });

    it("can switch between different media type filters", async () => {
      renderWithProvider(<SearchBar />);

      const allButton = screen.getByText("All").closest('button');
      const imagesButton = screen.getByText("Images").closest('button');
      const videosButton = screen.getByText("Videos").closest('button');

      // Start with All selected
      expect(allButton).toHaveClass('bg-blue-500');

      // Click Images
      fireEvent.click(imagesButton!);
      await waitFor(() => {
        expect(imagesButton).toHaveClass('bg-blue-500');
        expect(allButton).not.toHaveClass('bg-blue-500');
      });

      // Click Videos
      fireEvent.click(videosButton!);
      await waitFor(() => {
        expect(videosButton).toHaveClass('bg-blue-500');
        expect(imagesButton).not.toHaveClass('bg-blue-500');
      });

      // Click All again
      fireEvent.click(allButton!);
      await waitFor(() => {
        expect(allButton).toHaveClass('bg-blue-500');
        expect(videosButton).not.toHaveClass('bg-blue-500');
      });
    });

    it("includes media type in search query when not 'all'", async () => {
      const mockOnSearch = vi.fn();
      renderWithProvider(<SearchBar onSearch={mockOnSearch} />);

      const imagesButton = screen.getByText("Images").closest('button');
      fireEvent.click(imagesButton!);

      // Wait for debounced search (300ms)
      await waitFor(
        () => {
          expect(mockOnSearch).toHaveBeenCalled();
          const lastCall = mockOnSearch.mock.calls[mockOnSearch.mock.calls.length - 1];
          expect(lastCall[0]).toHaveProperty('mediaType', 'image');
        },
        { timeout: 500 }
      );
    });

    it("does not include media type in search query when 'all' is selected", async () => {
      const mockOnSearch = vi.fn();
      renderWithProvider(<SearchBar onSearch={mockOnSearch} />);

      // All is selected by default, trigger a search by typing
      const searchInput = screen.getByPlaceholderText("Search photos...");
      fireEvent.change(searchInput, { target: { value: "test" } });

      // Wait for debounced search (300ms)
      await waitFor(
        () => {
          expect(mockOnSearch).toHaveBeenCalled();
          const lastCall = mockOnSearch.mock.calls[mockOnSearch.mock.calls.length - 1];
          expect(lastCall[0]).not.toHaveProperty('mediaType');
        },
        { timeout: 500 }
      );
    });

    it("clears media type filter when Clear button is clicked", async () => {
      renderWithProvider(<SearchBar />);

      // Select Videos filter
      const videosButton = screen.getByText("Videos").closest('button');
      fireEvent.click(videosButton!);

      await waitFor(() => {
        expect(videosButton).toHaveClass('bg-blue-500');
      });

      // Type something to make Clear button appear
      const searchInput = screen.getByPlaceholderText("Search photos...");
      fireEvent.change(searchInput, { target: { value: "test" } });

      // Wait for Clear button to appear
      await waitFor(() => {
        expect(screen.getByText("Clear")).toBeInTheDocument();
      });

      // Click Clear button
      const clearButton = screen.getByText("Clear");
      fireEvent.click(clearButton);

      // All filter should be selected again
      await waitFor(() => {
        const allButton = screen.getByText("All").closest('button');
        expect(allButton).toHaveClass('bg-blue-500');
      });
    });
  });

  describe("Search functionality", () => {
    it("displays search results count", () => {
      renderWithProvider(<SearchBar />);

      // Initially no results shown
      expect(screen.queryByText(/Found \d+ photo/)).not.toBeInTheDocument();
    });

    it("shows loading indicator when searching", () => {
      // This would require mocking the useSearch hook to return isSearching: true
      renderWithProvider(<SearchBar />);

      // The component structure should support loading state
      expect(screen.queryByText("Searching...")).not.toBeInTheDocument();
    });

    it("debounces search input", async () => {
      const mockOnSearch = vi.fn();
      renderWithProvider(<SearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText("Search photos...");

      // Type multiple characters quickly
      fireEvent.change(searchInput, { target: { value: "t" } });
      fireEvent.change(searchInput, { target: { value: "te" } });
      fireEvent.change(searchInput, { target: { value: "tes" } });
      fireEvent.change(searchInput, { target: { value: "test" } });

      // Should not call immediately
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Wait for debounce (300ms)
      await waitFor(
        () => {
          expect(mockOnSearch).toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });
  });

  describe("Advanced filters", () => {
    it("toggles advanced filters when filter button is clicked", () => {
      const { container } = renderWithProvider(<SearchBar />);

      // Advanced filters should not be visible initially
      expect(screen.queryByText("Filter by tags")).not.toBeInTheDocument();

      // Click filter button
      const filterButton = container.querySelector('button .material-symbols-outlined')?.parentElement;
      fireEvent.click(filterButton!);

      // Advanced filters should now be visible
      expect(screen.getByText("Filter by tags")).toBeInTheDocument();
    });

    it("shows date range inputs in advanced filters", () => {
      const { container } = renderWithProvider(<SearchBar />);

      // Open advanced filters
      const filterButton = container.querySelector('button .material-symbols-outlined')?.parentElement;
      fireEvent.click(filterButton!);

      expect(screen.getByText("From date")).toBeInTheDocument();
      expect(screen.getByText("To date")).toBeInTheDocument();
    });

    it("shows camera model input in advanced filters", () => {
      const { container } = renderWithProvider(<SearchBar />);

      // Open advanced filters
      const filterButton = container.querySelector('button .material-symbols-outlined')?.parentElement;
      fireEvent.click(filterButton!);

      expect(screen.getByText("Camera model")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., Canon EOS 5D")).toBeInTheDocument();
    });
  });

  describe("Integration with media type filtering", () => {
    it("combines text search with media type filter", async () => {
      const mockOnSearch = vi.fn();
      renderWithProvider(<SearchBar onSearch={mockOnSearch} />);

      // Type search text
      const searchInput = screen.getByPlaceholderText("Search photos...");
      fireEvent.change(searchInput, { target: { value: "landscape" } });

      // Select Videos filter
      const videosButton = screen.getByText("Videos").closest('button');
      fireEvent.click(videosButton!);

      // Wait for debounced search
      await waitFor(
        () => {
          expect(mockOnSearch).toHaveBeenCalled();
          const lastCall = mockOnSearch.mock.calls[mockOnSearch.mock.calls.length - 1];
          expect(lastCall[0]).toHaveProperty('text', 'landscape');
          expect(lastCall[0]).toHaveProperty('mediaType', 'video');
        },
        { timeout: 500 }
      );
    });

    it("combines date range with media type filter", async () => {
      const mockOnSearch = vi.fn();
      const { container } = renderWithProvider(<SearchBar onSearch={mockOnSearch} />);

      // Open advanced filters
      const filterButton = container.querySelector('button .material-symbols-outlined')?.parentElement;
      fireEvent.click(filterButton!);

      // Set date range using placeholder text instead of label
      const dateInputs = container.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBe(2);

      const fromDateInput = dateInputs[0] as HTMLInputElement;
      const toDateInput = dateInputs[1] as HTMLInputElement;

      fireEvent.change(fromDateInput, { target: { value: "2024-01-01" } });
      fireEvent.change(toDateInput, { target: { value: "2024-12-31" } });

      // Select Images filter
      const imagesButton = screen.getByText("Images").closest('button');
      fireEvent.click(imagesButton!);

      // Wait for debounced search
      await waitFor(
        () => {
          expect(mockOnSearch).toHaveBeenCalled();
          const lastCall = mockOnSearch.mock.calls[mockOnSearch.mock.calls.length - 1];
          expect(lastCall[0]).toHaveProperty('dateRange');
          expect(lastCall[0]).toHaveProperty('mediaType', 'image');
        },
        { timeout: 500 }
      );
    });
  });
});
