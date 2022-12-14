import { Download, Share } from "@mui/icons-material";
import { Button, CircularProgress, Typography } from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import ShareDialog from "../components/ShareDialog";
import { auth, db, storage } from "../services/firebase";
import { errorHandler } from "../services/utils";

export default function DisplayFile() {

  const loaderData = useLoaderData();
  const navigate = useNavigate()
  const [fileData, setFileData] = useState(null)
  const [shareDialOpen, setShareDialOpen] = useState(false)

  useEffect(()=>{
    document.body.classList.add("bg-black")

    if (loaderData.status=="failed") {
      alert(loaderData.err);
      navigate("/")
    }

    else if(loaderData.status=="success") {

      getDownloadURL(ref(storage, loaderData.data.owner+"/"+loaderData.data.id)).then(url=>{
        setFileData({
          downloadURL : url,
          ...loaderData.data
        })
      }).catch(errorHandler)
    }

    

    return ()=> document.body.classList.remove("bg-black")
  }, [])

  const handleShare = ()=> {
    setShareDialOpen(true)
  }

  const handleDownload = ()=> {
    window.open(fileData.downloadURL)
  }

  return (
    <center className="relative">
      <div className="w-full flex justify-between">
        <Typography
          variant="h5"
          component="h1"
          className="pl-4 text-left text-white pt-4 overflow-x-hidden text-ellipsis whitespace-nowrap"
        >
          {fileData && fileData.filename}
        </Typography>
        <div className="flex p-2">
          <Button onClick={handleDownload} sx={{mr: 1}} variant="contained">
            <Download/>
          </Button>
          {
            loaderData && loaderData.access_level=="owner" ? <>
              <Button onClick={handleShare} variant="contained">
                <Share/>
              </Button>
            </>
            : null
          }
          {
            fileData && <ShareDialog handleClose={()=>{setShareDialOpen(false)}} open={shareDialOpen} emails={fileData.shared} file_id={fileData.id} is_Public={fileData.isPublic} />
          }
        </div>
      </div>
      {
        // Preview element
        !fileData ? <CircularProgress /> :
        fileData.type.includes("text") ? <iframe src={fileData.downloadURL} style={{height: "80vh"}} className="mt-4 w-2/3 md:w-1/3 bg-white text-black" ></iframe> :
        fileData.type.includes("image") ? <img src={fileData.downloadURL} className="mt-4 h-96"/> :
        <img src="/file.png" className="h-96"/>
      }
    </center>
  )
}

export async function loader ({ params }) {
  
  let res;

  const fileRef = doc(db, "Files", params.fileId)
  const snapshot = await getDoc(fileRef)

  try {
    const data = snapshot.data();

    // Check if the user is owner or not
    if (data.owner == auth.currentUser.uid) {
      res = {
        status : "success",
        access_level : "owner",
        data : {
          id : snapshot.id,
          ...data
        }
      }
    }

    // Check if the file is public
    else if (data.isPublic) {
      res = {
        status : "success",
        access_level : "shared",
        data : {
          id : snapshot.id,
          ...data
        }
      }
    }

    // Check if the user has file access or not
    else if (data.shared.includes(auth.currentUser.email)) {
      res = {
        status : "success",
        access_level : "shared",
        data : {
          id : snapshot.id,
          ...data
        }
      }
    }

    // The user does not have access
    else {
      res = {
        status : "failed",
        err : "access denied"
      }
    }
  } catch(err) {
    res = {
      status : "failed",
      err : "File Not Found or some server error."
    }
    console.log(err);
  }
  
  return res

}
