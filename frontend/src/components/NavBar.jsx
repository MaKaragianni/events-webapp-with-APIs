import LogoutButton from "./LogoutButton";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authClient } from "../services/authentication";
import pinkLogo from "../assets/logo-secondary.svg"


// need to make logout button dynamic (login / logout) checking session exists
// don't show profile to logged out

const NavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { pathname } = location

    const { data: session, isPending } = authClient.useSession();
    if (isPending) return null;

    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-navbar">
            <Link to="/" className="font-heading text-xl text-primary-foreground tracking-tight">
                <img src={pinkLogo} alt="enCore Logo" className="h-8"/>
                {/* <span className="text-secondary">EnCore</span> */}
            </Link>

            <div className="flex items-center gap-6 text-sm">
                {pathname !== "/feed" && (
                    <button
                        onClick={() => navigate("/feed")}
                        className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                    >
                        Feed
                    </button>
                )}
                {session && pathname !== "/profile" && (
                    <button
                        onClick={() => navigate("/profile")}
                        className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                    >
                        Profile
                    </button>
                )}
                {session ? (
                    <LogoutButton className="rounded-md border border-primary-foreground/20 px-5 py-2 text-primary-foreground font-medium hover:bg-primary-foreground/10 hover:border-primary-foreground/40 transition-colors" />
                ) : (
                    <button
                        onClick={() => navigate("/login")}
                        className="rounded-md border border-primary-foreground/20 px-5 py-2 text-primary-foreground font-medium hover:bg-primary-foreground/10 hover:border-primary-foreground/40 transition-colors"
                    >
                        Log in
                    </button>
                )}
            </div>
        </nav>
    )
}


export default NavBar;