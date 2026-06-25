import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";

import { ProfilePage } from "../../src/pages/Profile/ProfilePage";

vi.mock("../../src/services/authentication", () => ({
    authClient: {
        useSession: vi.fn(),
    },
}));

vi.mock("../../src/services/userProfile", () => ({
    getMyProfile: vi.fn(),
}));

import { authClient } from "../../src/services/authentication";
import { getMyProfile } from "../../src/services/userProfile";

describe("Profile Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("displays user profile information when data loads", async () => {
        // Mock the session (authentication)
        authClient.useSession.mockReturnValue({
            data: {
                user: {
                    name: "Test User",
                    email: "user@test.com"
                }
            },
            isPending: false,
        });

        // Mock the profile data
        getMyProfile.mockResolvedValue({
            profile: {
                authUserId: "fakeUserId",
                homeLocation: {
                    city: "London",
                    lat: 51.5072,
                    long: 0.1276
                },
                favouriteArtists: ["Beyonce", "Mariah Carey"],
                bookings: []
            }
        });
        
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        expect(await screen.findByText("Your location: London")).toBeInTheDocument();
        expect(screen.getByText("Beyonce")).toBeInTheDocument();
        expect(screen.getByText("Mariah Carey")).toBeInTheDocument();
        expect(screen.getByText("Your name: Test User")).toBeInTheDocument();
    });

    test("shows error message when fetching profile fails", async () => {
        authClient.useSession.mockReturnValue({
            data: {
                user: {
                    name: "Test User",
                }
            },
            isPending: false,
        });

        getMyProfile.mockRejectedValue(new Error("Unable to fetch user's profile"));

        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        expect(
            await screen.findByText("Unable to fetch user's profile")
        ).toBeInTheDocument();
    });
});