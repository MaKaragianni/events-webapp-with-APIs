import '@geoapify/geocoder-autocomplete/styles/minimal.css'
import { GeoapifyContext, GeoapifyGeocoderAutocomplete } from '@geoapify/react-geocoder-autocomplete'

const LocationSearch = ({ onCitySelect, placeholder = "Search for your home city..." }) => {
    const handleSelect = (place) => {
        if (!place) return
        
        const city = place.properties.city || place.properties.name
        const lat = place.properties.lat
        const lng = place.properties.lon

        onCitySelect({ city, lat, lng })
    }

    return (
        <GeoapifyContext apiKey={import.meta.env.VITE_GEOAPIFY_API_KEY}>
            <div className="geoapify-signup-wrapper">
                <GeoapifyGeocoderAutocomplete
                    placeholder={placeholder}
                    type="city"
                    limit={3}
                    placeSelect={handleSelect}
                />
            </div>
        </GeoapifyContext>
    )
}

export default LocationSearch;