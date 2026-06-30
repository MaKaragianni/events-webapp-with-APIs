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


const HomeLocationUpdateDialog = ({isFirstLoginSession, setIsFirstLoginSession, onCompleted}) => {
    const [error, setError] = useState(null);

    const completeFirstLogin = async () => {
        await updateIsFirstLogin();
        setIsFirstLoginSession(false);
        if (onCompleted) {
            await onCompleted();
        }
    };

    const handleClose = async () => {
        try {
            await completeFirstLogin();
        } catch (err) {
            setError(err);
        }
    }
    
    return(
            // updates isFirstLogin when dialog closed with X button
            // <Dialog open={isFirstLoginSession}>
            <Dialog 
                open={isFirstLoginSession} 
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