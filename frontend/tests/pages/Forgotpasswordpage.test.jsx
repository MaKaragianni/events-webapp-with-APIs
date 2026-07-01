import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";

import { ForgotPasswordPage } from "../../src/pages/Login/ForgotPasswordPage";

vi.mock("../../src/services/authentication", () => ({
    authClient: {
        requestPasswordReset: vi.fn(),
    },
}));

import { authClient } from "../../src/services/authentication";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const FRONTEND_ORIGIN = window.location.origin;

function renderPage() {
    return render(
        <MemoryRouter>
            <ForgotPasswordPage />
        </MemoryRouter>
    );
}

async function fillAndSubmit(user, email = "maria@test.com") {
    await user.type(screen.getByPlaceholderText("Email"), email);
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
}

describe("ForgotPasswordPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
            configurable: true,
        });
    });

    test("renders the request form by default", () => {
        renderPage();

        expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Send reset link" })).toBeInTheDocument();
    });

    test("submits with the email and an absolute redirectTo pointing at /reset-password", async () => {
        authClient.requestPasswordReset.mockResolvedValue({ error: null });
        fetch.mockResolvedValue({ ok: true, json: async () => ({ url: null }) });
        const user = userEvent.setup();

        renderPage();
        await fillAndSubmit(user);

        expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
            email: "maria@test.com",
            redirectTo: `${FRONTEND_ORIGIN}/reset-password`,
        });
    });

    test("shows the 'check your email' message once the request succeeds", async () => {
        authClient.requestPasswordReset.mockResolvedValue({ error: null });
        fetch.mockResolvedValue({ ok: true, json: async () => ({ url: null }) });
        const user = userEvent.setup();

        renderPage();
        await fillAndSubmit(user, "maria@test.com");

        expect(
            await screen.findByText(/we've sent a link to reset your password/i)
        ).toBeInTheDocument();
        expect(screen.getByText("maria@test.com")).toBeInTheDocument();
    });

    test("shows an error message and does not proceed when the request fails", async () => {
        authClient.requestPasswordReset.mockResolvedValue({
            error: { message: "No account found" },
        });
        const user = userEvent.setup();

        renderPage();
        await fillAndSubmit(user);

        expect(await screen.findByText("No account found")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test("fetches the dev reset link and shows it in a pop-up instead of only logging it", async () => {
        authClient.requestPasswordReset.mockResolvedValue({ error: null });
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ url: "http://localhost:3000/api/auth/reset-password/abc123?callbackURL=xyz" }),
        });
        const user = userEvent.setup();

        renderPage();
        await fillAndSubmit(user);

        expect(fetch).toHaveBeenCalledWith(`${BACKEND_URL}/dev/reset-link`);

        const dialog = await screen.findByRole("dialog", { name: /development reset link/i });
        expect(dialog).toHaveTextContent(
            "http://localhost:3000/api/auth/reset-password/abc123?callbackURL=xyz"
        );
    });

    test("copying the link writes it to the clipboard and shows confirmation", async () => {
        authClient.requestPasswordReset.mockResolvedValue({ error: null });
        const resetLink = "http://localhost:3000/api/auth/reset-password/abc123?callbackURL=xyz";
        fetch.mockResolvedValue({ ok: true, json: async () => ({ url: resetLink }) });
        const user = userEvent.setup();
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText },
            configurable: true,
        });

        renderPage();
        await fillAndSubmit(user);

        const copyButton = await screen.findByRole("button", { name: /copy link/i });
        await user.click(copyButton);

        expect(writeText).toHaveBeenCalledWith(resetLink);
        expect(await screen.findByRole("button", { name: /copied!/i })).toBeInTheDocument();
    });

    test("closing the pop-up removes it from the screen", async () => {
        authClient.requestPasswordReset.mockResolvedValue({ error: null });
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ url: "http://localhost:3000/api/auth/reset-password/abc123?callbackURL=xyz" }),
        });
        const user = userEvent.setup();

        renderPage();
        await fillAndSubmit(user);

        await screen.findByRole("dialog", { name: /development reset link/i });
        await user.click(screen.getByRole("button", { name: "Close" }));

        expect(
            screen.queryByRole("dialog", { name: /development reset link/i })
        ).not.toBeInTheDocument();
    });

    test("does not show a pop-up and does not crash if no dev link is available yet", async () => {
        authClient.requestPasswordReset.mockResolvedValue({ error: null });
        fetch.mockResolvedValue({ ok: true, json: async () => ({ url: null }) });
        const user = userEvent.setup();

        renderPage();
        await fillAndSubmit(user);

        await screen.findByText(/we've sent a link to reset your password/i);
        expect(
            screen.queryByRole("dialog", { name: /development reset link/i })
        ).not.toBeInTheDocument();
    });

    test("does not crash if the dev-link fetch itself fails", async () => {
        authClient.requestPasswordReset.mockResolvedValue({ error: null });
        fetch.mockRejectedValue(new Error("network error"));
        const user = userEvent.setup();

        renderPage();
        await fillAndSubmit(user);

        expect(
            await screen.findByText(/we've sent a link to reset your password/i)
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("dialog", { name: /development reset link/i })
        ).not.toBeInTheDocument();
    });
});