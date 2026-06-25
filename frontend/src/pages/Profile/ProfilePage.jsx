import { useEffect, useState } from "react";
import { getMyProfile } from "../../services/userProfile";
import { authClient } from "../../services/authentication";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { data: session, isPending } = authClient.useSession()

    const navigate = useNavigate();

    useEffect(() => {
        getMyProfile()
            .then((data) => setProfile(data.profile))
            .catch((error) => setError(error))
            .finally(() => setLoading(false))
    }, []);

    if (error) return <p>{error.message}</p>;

    return (
        <div>
            <h1> Profile</h1>
            {profile &&
                <div>
                    <p>Your location: {profile.homeLocation.city}</p>
                    <p>Your favourite artists: </p>
                    {profile.favouriteArtists.length < 1 ? (
                        <p><i>Follow some artists for personalised recommendations!</i></p>
                    ) : (
                        <ul>
                            {profile.favouriteArtists.map((artist) => (
                                <li key={artist}>{artist}</li>
                            ))}
                        </ul>
                    )}
                    <p>Your bookings: </p>
                    {profile.bookings.length < 1 ? (
                        <p><i>No current bookings.</i></p>
                    ) : (
                        <ul>
                            {profile.bookings.map((booking) => {
                                <li key={booking}>{booking}</li>
                            })}
                        </ul>
                    )}
                    <p>Your name: {session.user.name}</p>
                </div>
            }
        </div>
    )
}