import { useState } from "react"
import { updateIsFirstLogin } from "../services/userProfile";
import HomeLocationForm from "./HomeLocationForm";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"


const HomeLocationUpdateDialog = ({profile, setNewHomeLocation}) => {
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(profile.isFirstLogin)

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

    // this will remove the dialog from that point on without re-fetching the profile
    // (since no changes were made to user's home location)
    const handleClose = async () => {
        try {
            await setFirstLoginToFalse();
            setDialogOpen(false);
        } catch (err) {
            setError(err);
            console.log(err)
        }
    }
    
    return(
            <Dialog 
                open={dialogOpen} 
                onOpenChange={(open) => {
                    if (!open) {
                        handleClose();
                }
            }}>
                <DialogContent
                    showCloseButton={false}
                >
                    <p>Set your location for a personalised feed!</p>
                    <HomeLocationForm 
                        onLocationUpdated={completeFirstLogin}
                    />
                    <p>Want to keep your location as Manchester for now? You can always update it on your profile page.</p>
                <DialogClose asChild>
                    <Button type="button" onClick={handleClose}>Close</Button>
                </DialogClose>
                </DialogContent>
            </Dialog>

    )
}

export default HomeLocationUpdateDialog