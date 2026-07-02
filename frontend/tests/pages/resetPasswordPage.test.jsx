import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ResetPasswordPage } from "../../src/pages/Login/ResetPasswordPage";

vi.mock("../../src/services/authentication", () => ({
    authClient: {
        resetPassword: vi.fn(),
    },
}));

import { authClient } from "../../src/services/authentication";

function renderPage(searchString = "?token=abc123") {
    return render(
        <MemoryRouter initialEntries={[`/reset-password${searchString}`]}>
            <Routes>
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

async function fillAndSubmit(user, { password = "newPassword123", confirm = "newPassword123" } = {}) {
    await user.type(screen.getByPlaceholderText("New password"), password);
    await user.type(screen.getByPlaceholderText("Confirm new password"), confirm);
    await user.click(screen.getByRole("button", { name: "Reset password" }));
}

describe("ResetPasswordPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders the reset password form when a token is present", () => {
        renderPage();

        expect(screen.getByPlaceholderText("New password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Confirm new password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reset password" })).toBeInTheDocument();
    });

    test("shows an invalid-link message when there is no token", () => {
        renderPage("");

        expect(
            screen.getByText(/this reset link is invalid or has expired/i)
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /request a new one/i })).toBeInTheDocument();
    });

    test("shows an error and does not call resetPassword when passwords do not match", async () => {
        const user = userEvent.setup();
        renderPage();

        await fillAndSubmit(user, { password: "newPassword123", confirm: "somethingElse" });

        expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
        expect(authClient.resetPassword).not.toHaveBeenCalled();
    });

    test("submits the new password with the token from the URL", async () => {
        authClient.resetPassword.mockResolvedValue({ error: null });
        const user = userEvent.setup();
        renderPage("?token=abc123");

        await fillAndSubmit(user);

        expect(authClient.resetPassword).toHaveBeenCalledWith({
            newPassword: "newPassword123",
            token: "abc123",
        });
    });

    test("shows a success message and redirects to login after a successful reset", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        authClient.resetPassword.mockResolvedValue({ error: null });
        const user = userEvent.setup({ delay: null });
        renderPage();

        await fillAndSubmit(user);

        expect(
            await screen.findByText(/your password has been updated/i)
        ).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(await screen.findByText("Login Page")).toBeInTheDocument();
        vi.useRealTimers();
    });

    test("shows an error message when the reset request fails", async () => {
        authClient.resetPassword.mockResolvedValue({
            error: { message: "Reset token expired" },
        });
        const user = userEvent.setup();
        renderPage();

        await fillAndSubmit(user);

        expect(await screen.findByText("Reset token expired")).toBeInTheDocument();
    });

    test("does not call resetPassword when the token is missing, even with matching passwords", async () => {
        const user = userEvent.setup();
        renderPage("");

        await user.type(screen.getByPlaceholderText("New password"), "newPassword123");
        await user.type(screen.getByPlaceholderText("Confirm new password"), "newPassword123");
        await user.click(screen.getByRole("button", { name: "Reset password" }));

        expect(
            await screen.findByText(/this reset link is invalid or has expired\. please request a new one/i)
        ).toBeInTheDocument();
        expect(authClient.resetPassword).not.toHaveBeenCalled();
    });
});