import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";

import { ProfilePage } from "../../src/pages/Profile/ProfilePage";

vi.mock("../../src/components/NavBar", () => ({
    default: () => <nav data-testid="navbar-stub" />,
}));
vi.mock("../../src/components/Footer", () => ({
    default: () => <footer data-testid="footer-stub" />,
}));
vi.mock("../../src/components/LocationSearch", () => ({
    default: () => <div data-testid="location-search-stub" />,
}));

vi.mock("../../src/services/authentication", () => ({
    authClient: {
        useSession: vi.fn(),
    },
}));

vi.mock("../../src/services/userProfile", () => ({
    getMyProfile: vi.fn(),
    getMyBookings: vi.fn(),
    getSavedEvents: vi.fn(),
    updateHomeLocation: vi.fn(),
}));

import { authClient } from "../../src/services/authentication";
import {
    getMyProfile,
    getMyBookings,
    getSavedEvents,
} from "../../src/services/userProfile";

const defaultSession = {
    data: { user: { name: "Test User", email: "user@test.com" } },
    isPending: false,
};

// Base profile shape reused across tests
const baseProfile = {
    authUserId: "fakeUserId",
    homeLocation: {
        city: "London",
        lat: 51.5072,
        long: 0.1276,
    },
    favouriteArtists: [],
    bookings: [],
};

function renderProfilePage() {
    return render(
        <MemoryRouter>
            <ProfilePage />
        </MemoryRouter>
    );
}

describe("Profile Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authClient.useSession.mockReturnValue(defaultSession);
        getMyBookings.mockResolvedValue({ bookings: [] });
        getSavedEvents.mockResolvedValue({ savedEvents: [] });
    });

    test("displays user profile information when data loads", async () => {
        getMyProfile.mockResolvedValue({
            profile: {
                ...baseProfile,
                favouriteArtists: ["Beyonce", "Mariah Carey"],
            },
        });

        renderProfilePage();

        expect(await screen.findByText("London")).toBeInTheDocument();
        expect(screen.getByText("Beyonce")).toBeInTheDocument();
        expect(screen.getByText("Mariah Carey")).toBeInTheDocument();
        expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument();
        expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    test("shows error message when fetching profile fails", async () => {
        getMyProfile.mockRejectedValue(new Error("Unable to fetch user's profile"));

        renderProfilePage();

        expect(
            await screen.findByText("Unable to fetch user's profile")
        ).toBeInTheDocument();
    });

    test("shows empty-state messages when bookings and saved events are empty", async () => {
        getMyProfile.mockResolvedValue({ profile: baseProfile });

        renderProfilePage();

        expect(await screen.findByText(/No upcoming bookings/i)).toBeInTheDocument();
        expect(screen.getByText(/No past bookings/i)).toBeInTheDocument();
        expect(screen.getByText(/No upcoming saved events/i)).toBeInTheDocument();
        expect(screen.getByText(/No past saved events/i)).toBeInTheDocument();
    });

    describe("bookings", () => {
        const upcomingBooking = {
            _id: "event-1",
            name: "Summer Tour 2026",
            artist: "Idles",
            venue: { name: "O2 Arena" },
            city: "London",
            date: "2026-08-01T19:00:00.000Z",
            time: "19:00:00",
            image: { url: "https://example.com/idles.jpg", width: 1280, height: 720 },
            ticketUrl: "https://ticketmaster.com/event/1",
            isPast: false,
        };

        const pastBooking = {
            _id: "event-old",
            name: "Old Gig",
            artist: "Blur",
            venue: { name: "Brixton Academy" },
            city: "London",
            date: "2020-01-01T20:00:00.000Z",
            time: "20:00",
            image: { url: "https://example.com/blur.jpg", width: 1280, height: 720 },
            isPast: true,
        };

        test("renders upcoming bookings with artist, venue, and date", async () => {
            getMyProfile.mockResolvedValue({ profile: baseProfile });
            getMyBookings.mockResolvedValue({ bookings: [upcomingBooking] });

            renderProfilePage();

            expect(await screen.findByText("Idles")).toBeInTheDocument();
            expect(screen.getByText("Summer Tour 2026")).toBeInTheDocument();
            expect(screen.getByText(/O2 Arena/i)).toBeInTheDocument();
        });

        test("renders past bookings in the past bookings section", async () => {
            getMyProfile.mockResolvedValue({ profile: baseProfile });
            getMyBookings.mockResolvedValue({ bookings: [pastBooking] });

            renderProfilePage();

            const pastSection = await screen.findByRole("region", { name: /past bookings/i });
            expect(pastSection).toBeInTheDocument();
            expect(screen.getByText("Blur")).toBeInTheDocument();
            expect(screen.getByText(/Brixton Academy/i)).toBeInTheDocument();
        });

        test("displays the booking time as HH:MM, stripping any seconds component", async () => {
            getMyProfile.mockResolvedValue({ profile: baseProfile });
            getMyBookings.mockResolvedValue({ bookings: [upcomingBooking] });

            renderProfilePage();

            await screen.findByText("Idles");
            expect(screen.getByText(/19:00$/)).toBeInTheDocument();
            expect(screen.queryByText(/19:00:00/)).not.toBeInTheDocument();
        });

        test("renders the booking image using the same classNames as the Feed page's EventCard", async () => {
            getMyProfile.mockResolvedValue({ profile: baseProfile });
            getMyBookings.mockResolvedValue({ bookings: [upcomingBooking] });

            renderProfilePage();

            const image = await screen.findByTestId("event-snapshot-image");
            expect(image).toHaveAttribute("src", upcomingBooking.image.url);
            expect(image).toHaveClass("event-image");
            expect(image.closest("li")).toHaveClass("event-card");
        });

        test("clicking an upcoming booking with a ticketUrl opens it in a new tab", async () => {
            const openSpy = vi.spyOn(window, "open").mockImplementation(() => {});
            getMyProfile.mockResolvedValue({ profile: baseProfile });
            getMyBookings.mockResolvedValue({ bookings: [upcomingBooking] });

            renderProfilePage();

            const card = await screen.findByTestId("event-snapshot-card");
            card.click();

            expect(openSpy).toHaveBeenCalledWith(upcomingBooking.ticketUrl, "_blank");
            openSpy.mockRestore();
        });
    });

    describe("saved events", () => {
        const upcomingSavedEvent = {
            eventId: "event-2",
            name: "Glasto Warm-up",
            artist: "Wet Leg",
            venue: "Albert Hall",
            city: "Manchester",
            date: "2026-09-12T19:00:00.000Z",
            time: "19:00",
            image: { url: "https://example.com/wetleg.jpg", width: 1280, height: 720 },
            tags: ["Indie"],
            isPast: false,
        };

        test("renders upcoming saved events with image and details", async () => {
            getMyProfile.mockResolvedValue({ profile: baseProfile });
            getSavedEvents.mockResolvedValue({ savedEvents: [upcomingSavedEvent] });

            renderProfilePage();

            expect(await screen.findByText("Wet Leg")).toBeInTheDocument();
            expect(screen.getByText("Glasto Warm-up")).toBeInTheDocument();
            expect(screen.getByText(/Albert Hall/i)).toBeInTheDocument();

            const image = screen.getByTestId("event-snapshot-image");
            expect(image).toHaveAttribute("src", upcomingSavedEvent.image.url);
            expect(image).toHaveClass("event-image");
        });

        test("renders past saved events in the past saved events section", async () => {
            getMyProfile.mockResolvedValue({ profile: baseProfile });
            getSavedEvents.mockResolvedValue({
                savedEvents: [{ ...upcomingSavedEvent, eventId: "event-3", isPast: true }],
            });

            renderProfilePage();

            const pastSection = await screen.findByRole("region", { name: /past saved events/i });
            expect(pastSection).toBeInTheDocument();
            expect(screen.getByText("Wet Leg")).toBeInTheDocument();
        });
    });
});