import { Button, Typography } from "@mui/material";
import { getAdditionalUserInfo, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db, gprovider } from "../../services/firebase";
import { errorHandler } from "../../services/utils";

export default function GoogleSignIn() {

  const navigate = useNavigate();
    
  const handleGoogleSignIn =() => {
    signInWithPopup(auth, gprovider).then(res=> {
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const token = credential.accessToken;

      // Check whether new user or not
      const additionalInfo = getAdditionalUserInfo(res)
      
      if (additionalInfo.isNewUser) {
        
        setDoc(doc(db, "Users", res.user.uid), {
          userName : res.user.displayName,
          email : res.user.email,
        }).then(val=>{
          navigate("/")
        })
      }

      navigate("/")
    }).catch(errorHandler)
  }


  return (
    <Button onClick={handleGoogleSignIn} variant="outlined" sx={{mt: 4}}>
        <img src="/google.png" alt="google" className='h-8 mr-4' />
        <Typography>Sign In With Google</Typography>
    </Button>
  )
}
