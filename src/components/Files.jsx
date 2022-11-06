import { DriveFolderUploadRounded, UploadFileRounded } from "@mui/icons-material";
import { Breadcrumbs, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { addDoc, collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link } from "react-router-dom";
import { auth, db, storage } from "../services/firebase";
import { errorHandler } from "../services/utils";


export default function Files() {

  const [files, setFiles] = useState(null)
  const [path, setPath] = useState("/")
  const [open, setOpen] = useState(false)
  const [breadCrumps, setBreadCrumps] = useState()
  const [user, loadingAuth] = useAuthState(auth)

  useEffect(()=> {
    function toPath(path, index) {
      let str = "/"
      for(let i=1; i<=index; i++) {
        str+=path[i]
      }
      return str;
    }

    let paths = path.split("/").map((p, i, arr)=> {
      if (i==arr.length-1) {
        return <Typography key={i} component="span" >{p}</Typography>
      }
      
      else if(i==0) {
        return <Button key={i} onClick={()=>setPath("/")}>/</Button>
      } 

      return <Button key={i} onClick={()=>{
        setPath(toPath(arr, i))
      }}>{p}</Button>
    })

    setBreadCrumps(paths)

    if(loadingAuth) return

    const q = query(collection(db, "Files"), where("owner", "==", user.uid), where("path", "==", path))

    const unsubscribe = onSnapshot(q, (res)=> {
      setFiles(res.docs.map(doc=>{
        return {
          id : doc.id,
          ...doc.data()
        }
      }))
    })

    return () => unsubscribe()

  }, [loadingAuth, path])

  const createDirectory = ()=> {
    const dirname = prompt("Enter Name of new folder", "New Folder "+new Date().getTime() )

    addDoc(collection(db, "Files"), {
      filename : dirname,
      owner : user.uid,
      path : path,
      type : "folder",
      shared : []
    }).then(res=>{
      console.log("done..!")
    }).catch(errorHandler)
  }  

  return (
    <section className="p-4 mt-2 flex flex-wrap relative">
      <div className="w-full">
        <Breadcrumbs separator="›" aria-label="breadcrumb">
          {breadCrumps}
        </Breadcrumbs>
      </div>
      {
        !files ? <CircularProgress />
        : files.map(file=> {
          if (file.type=="file") {
            return <File name={file.filename} to={file.id} />
          } else {
            return <Folder name={file.filename} path={path} setPath={setPath} />
          }
        })
      }
      <div className="absolute right-2 top-2 p-2 w-fit">
        <div className="my-2">
          <Button onClick={()=>setOpen(true)} variant="outlined">
            <UploadFileRounded />
          </Button>
        </div>
        <div className="my-2">
          <Button onClick={createDirectory} variant="outlined">
            <DriveFolderUploadRounded />
          </Button>
        </div>

        <FileUploadDialog open={open} setOpen={setOpen} path={path} setPath={setPath}/>
        
      </div>
    </section>
  )
}

function FileUploadDialog({ open, setOpen, path, setPath }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(null)
  const [user] = useAuthState(auth)

  const handleDialogClose = ()=> {
    setOpen(false)
  }

  const handleFileSubmit = async ()=> {
    if (selectedFile) {
      const doc = await addDoc(collection(db, "Files"), {
        filename : selectedFile.name,
        owner : user.uid,
        path : path,
        type : "file",
        shared : []
      })

      const uploadTask = uploadBytesResumable(storageRef(storage, user.uid+"/"+doc.id), selectedFile, {
        contentType : selectedFile.type
      })

      uploadTask.on(`state_changed`, (snapshot)=>{

        const progressSnap = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progressSnap)

        switch (snapshot.state) {
          case 'paused':
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }
        
      },  errorHandler , ()=> {
        setSelectedFile(null)
        setOpen(false)
        setProgress(null)
      })
    }
  }

  return <>
    <Dialog open={open} onClose={handleDialogClose}>
      <DialogTitle>Upload File</DialogTitle>
      <DialogContent>
        { progress && <CircularProgress variant="determinate" value={progress} />}
        <input 
          type="file" 
          onChange={(e)=>{
            const file = e.target.files ? e.target.files[0] : undefined;
            setSelectedFile(file);
          }} 
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleFileSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  </>
}

function Folder({name, path, setPath}) {
  return (
    <div className="text-center w-fit mx-4 cursor-pointer" onClick={()=>setPath(path=="/" ? path+=name : path+=("/"+name))}>
      <img src="/folder.png" className="h-24 select-none" alt="folder icon" />
      <span>{name}</span>
    </div>
  )
}

function File({name, to}) {
  return (
    <Link to={"/file/"+to}>
      <div className="text-center w-fit mx-4">
        <img src="/file.png" className="h-24 select-none" alt="file icon" />
        <span>{name}</span>
      </div>
    </Link>
  )
}
