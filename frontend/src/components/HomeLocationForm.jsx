import { useState } from "react"
import { updateHomeLocation } from "../services/userProfile";
import LocationSearch from "./LocationSearch";
import { Button } from "@/components/ui/button";

const HomeLocationForm = ({ onLocationUpdated }) => {
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [error, setError] = useState(null);

    const handleLocationSubmit = async (e) => {
        e.preventDefault()
        if (!selectedLocation) return
        try {
            const updatedCity = await updateHomeLocation({ 
            city: selectedLocation.city, 
            lat: selectedLocation.lat, 
            long: selectedLocation.lng
        })
        if (onLocationUpdated) {
            onLocationUpdated(updatedCity)
        }
            
        } catch (err) {
            setError(err)
            console.log(err)
        }
    }
    
    return(
        <form onSubmit={handleLocationSubmit}>
            <LocationSearch onCitySelect={({ city, lat, lng }) => {
                setSelectedLocation({ city, lat, lng })
            }} />
            <Button type="submit">Update</Button>
        </form>
    )
}

export default HomeLocationForm