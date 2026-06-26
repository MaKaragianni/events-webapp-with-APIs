import LogoutButton from "./LogoutButton";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authClient } from "../services/authentication";


// need to make logout button dynamic (login / logout) checking session exists
// don't show profile to logged out

const NavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { pathname } = location

    const { data: session, isPending } = authClient.useSession();
    if (isPending) return null;

    return (
        <nav style={{borderBottom : "1px solid black"}}>
            {pathname !== "/feed" && <button onClick={() => navigate("/feed")}>Feed</button>}
            {session && (pathname !== "/profile") && <button onClick={() => navigate("/profile")}>Profile</button>}
            {session ? <LogoutButton/> : <button onClick={() => navigate("/login")}>Login</button>}
        </nav>
        
    )
}


export default NavBar;