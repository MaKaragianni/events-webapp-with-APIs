import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import { EventPage } from "../../src/pages/Event/EventPage";
import { getEventById, getPurchaseLink } from "../../src/services/events";
import { authClient } from "../../src/services/authentication";

vi.mock("../../src/services/events", () => ({
  getEventById: vi.fn(),
  getPurchaseLink: vi.fn()
}));

vi.mock("../../src/services/authentication", () => ({
  authClient: {
    useSession: vi.fn()
  }
}));

const mockedNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate
  };
});

const renderPage = (initialSession = null) => {
  authClient.useSession.mockReturnValue({
    data: initialSession
  });

  return render(
    <MemoryRouter initialEntries={["/events/123"]}>
      <Routes>
        <Route path="/events/:id" element={<EventPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("EventPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows loading state initially", () => {
    getEventById.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("renders event details after fetch", async () => {
    getEventById.mockResolvedValue({
      event: {
        name: "Test Event",
        artist: "Test Artist",
        genre: "Rock",
        city: "Manchester"
      }
    });

    renderPage();

    expect(await screen.findByText("Test Event")).toBeInTheDocument();
    expect(screen.getByText("Test Artist")).toBeInTheDocument();
    expect(screen.getByText("Rock")).toBeInTheDocument();
    expect(screen.getByText("Manchester")).toBeInTheDocument();
  });

  test("shows error state if fetch fails", async () => {
    getEventById.mockRejectedValue(new Error("API failed"));

    renderPage();

    expect(
      await screen.findByText("Error loading event")
    ).toBeInTheDocument();
  });

  test("shows event not found if event is null", async () => {
    getEventById.mockResolvedValue({
      event: null
    });

    renderPage();

    expect(
      await screen.findByText("Event not found")
    ).toBeInTheDocument();
  });

  test("redirects to login if user not logged in and clicks buy", async () => {
    getEventById.mockResolvedValue({
      event: {
        name: "Test Event",
        artist: "A",
        genre: "B",
        city: "C"
      }
    });

    renderPage(null);

    const button = await screen.findByRole("button", {
      name: /buy tickets/i
    });

    fireEvent.click(button);

    expect(mockedNavigate).toHaveBeenCalledWith("/login");
  });

  test("calls purchase link and redirects when logged in", async () => {
    delete window.location;
    window.location = { href: "" };

    authClient.useSession.mockReturnValue({
      data: { user: { id: "1" } }
    });

    getEventById.mockResolvedValue({
      event: {
        name: "Test Event",
        artist: "A",
        genre: "B",
        city: "C"
      }
    });

    getPurchaseLink.mockResolvedValue({
      ticketUrl: "https://ticketmaster.com/test"
    });

    renderPage({ user: { id: "1" } });

    const button = await screen.findByRole("button", {
      name: /buy tickets/i
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(getPurchaseLink).toHaveBeenCalledWith("123");
      expect(window.location.href).toBe(
        "https://ticketmaster.com/test"
      );
    });
  });
});