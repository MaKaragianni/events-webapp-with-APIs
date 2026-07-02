import { useState } from "react"
import { updateIsFirstLogin } from "../services/userProfile";
import HomeLocationForm from "./HomeLocationForm";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const HomeLocationUpdateDialog = ({ profile, setNewHomeLocation }) => {
    const [error, setError] = useState(null);
    
    // Only pop-up if it's the user's first login AND they've never explicitly
    // set a home location themselves. We can't rely on homeLocation.city being
    // empty here, because the schema defaults it to "Manchester" for everyone -
    // hasSetHomeLocation is the source of truth for "did the user actually pick one".
    const [dialogOpen, setDialogOpen] = useState(profile.isFirstLogin && !profile.hasSetHomeLocation)

    const setFirstLoginToFalse = async () => {
        await updateIsFirstLogin();
    }
    
    const completeFirstLogin = async () => {
        await setFirstLoginToFalse();
        setDialogOpen(false);
        if (setNewHomeLocation) {
            await setNewHomeLocation();
        }
    };

    const handleClose = async () => {
        try {
            await setFirstLoginToFalse();
            setDialogOpen(false);
        } catch (err) {
            setError(err);
            console.log(err)
        }
    }
    
    return (
        <Dialog 
            open={dialogOpen} 
            onOpenChange={(open) => {
                if (!open) {
                    handleClose();
                }
            }}
        >
            <DialogContent showCloseButton={false}>
                <p className="font-medium text-foreground">
                    Want to set a home city for personalized recommendations?
                </p>
                
                <HomeLocationForm 
                    onLocationUpdated={completeFirstLogin}
                />
                
                {/* Updated descriptive/optional text */}
                <p className="text-xs text-muted-foreground mt-1">
                    It looks like you missed this during signup! It's completely optional. If you don't want to set one right now, you can just click close and update it on your profile page anytime.
                </p>
                
                <DialogClose render={<Button type="button" onClick={handleClose} />}>
                    Close
                </DialogClose>
            </DialogContent>
        </Dialog>
    )
}

export default HomeLocationUpdateDialog