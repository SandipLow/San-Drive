import { DriveFolderUploadRounded, UploadFileRounded } from "@mui/icons-material";
import { Breadcrumbs, Button, CircularProgress, Typography, TextField } from "@mui/material";
import { addDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../services/firebase";
import { errorHandler } from "../../services/utils";
import { FileUploadDialog } from "./FileUploadDialog";
import { RightClickMenu } from "./RightClickMenu";


export default function Files() {

  const [files, setFiles] = useState(null)
  const [path, setPath] = useState("/")
  const [open, setOpen] = useState(false)
  const [breadCrumps, setBreadCrumps] = useState()
  const [anchorEle, setAnchorEle] = useState(null)
  const rightClickOpen = Boolean(anchorEle);
  const [user, loadingAuth] = useAuthState(auth)
  const [search, setSearch] = useState("")
  const [errFiles, setErrFiles] = useState(false)

  useEffect(()=> {

    // Convert to Path from a Path to given index
    // For example : toPath("/a/b/c", 2) => "/a/b"
    function toPath(path, index) {
      let str = "/"
      for(let i=1; i<=index; i++) {
        str+=path[i]
      }
      return str;
    }

    // Making Links for each breadcrump
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

    // return if auth is not loaded
    if(loadingAuth) return

    // query files from given path
    const q = query(collection(db, "Files"), where("owner", "==", user.uid), where("path", "==", path))

    const unsubscribe = onSnapshot(q, 
      (res)=> {
        setFiles(res.docs.map(doc=>{
          return {
            id : doc.id,
            ...doc.data()
          }
        }))
        setErrFiles(false)
      },
      (err)=> {
        setErrFiles(true)
        console.log(err);
      }
    )

    return () => unsubscribe()

  }, [loadingAuth, path])

  const createDirectory = ()=> {
    const dirname = prompt("Enter Name of new folder", "New Folder "+new Date().getTime() )

    if (!dirname) return

    addDoc(collection(db, "Files"), {
      filename: dirname,
      owner: user.uid,
      path: path,
      type: "folder",
      isPublic : false,
      domains : [],
      shared: []
    }).then(()=>{
      console.log("done..!")
    }).catch(errorHandler)
  }

  return (
    <section className="p-4 mt-2 md:relative">
      {/* Search and Breadcrump */}
      <div className="w-full flex flex-wrap">
        <TextField id="filled-basic" label="Search File" variant="outlined" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <Breadcrumbs sx={{mt: 2, mb: 2, ml: 4}} separator="›" aria-label="breadcrumb">
          {breadCrumps}
        </Breadcrumbs>
      </div>
      {/* Files */}
      <div className="w-full m-2 p-2 rounded-lg bg-slate-100 flex flex-wrap">
      {
        errFiles ? <div className="w-full text-center"><img src="/Error.jpeg" className="h-48 inline-block" alt="error connecting...!" /></div> :
        !files ? <div className="w-full text-center"><CircularProgress /></div> :
        files.length==0 ? <div className="w-full text-center">
          <img src="/empty.png" className="h-48 inline-block" alt="Nothing Here.." /><br />
          <span>No Files here</span>
        </div> :
        files.map(file=> {
          if (search == "") {

            if (file.type=="folder") {
              return <Folder key={file.id} name={file.filename} docId={file.id} path={path} setPath={setPath} setAnchorEl={setAnchorEle} />
            } else {
              return <File key={file.id} name={file.filename} docId={file.id} setAnchorEl={setAnchorEle} />
            }

          }

          else {

            if (file.filename.includes(search)) {
              
              if (file.type=="folder") {
                return <Folder key={file.id} name={file.filename} docId={file.id} path={path} setPath={setPath} setAnchorEl={setAnchorEle} />
              } else {
                return <File key={file.id} name={file.filename} docId={file.id} setAnchorEl={setAnchorEle} />
              }

            }
          }
        })
      }
      </div>
      {/* Upload */}
      <div className="absolute md:flex right-2 bottom-2 md:top-2 p-2 w-fit">
        <div className="my-2 md:mx-2">
          <Button onClick={()=>setOpen(true)} variant="outlined">
            <UploadFileRounded />
          </Button>
        </div>
        <div className="my-2 md:mx-2">
          <Button onClick={createDirectory} variant="outlined">
            <DriveFolderUploadRounded />
          </Button>
        </div>
      </div>

      <FileUploadDialog open={open} setOpen={setOpen} path={path} setPath={setPath}/>
      <RightClickMenu open={rightClickOpen} anchorEl={anchorEle} setAnchorEl={setAnchorEle} emails={["To be implemented"]} />
    </section>
  )
}

function Folder({name, path, docId, setPath, setAnchorEl}) {
  const thisRef = useRef()

  const handleOpenFolder = (e)=> {
    setPath(path=="/" ? path+=name : path+=("/"+name))

  }

  const handleOpenMenu = (e)=> {
    e.preventDefault()
    setAnchorEl(thisRef.current)
  }

  return (
    <div className="text-center w-32 m-2 relative select-none" docid={docId} type="folder" ref={thisRef} path={path=="/" ? path+name : path+("/"+name)} onContextMenu={handleOpenMenu} onDoubleClick={handleOpenFolder}>
      <div className="absolute w-full h-full"></div>
      <img src="/folder.png" className="w-fit h-24 inline-block" alt="folder icon" />
      <span>{name}</span>
    </div>
  )
}

function File({name, docId, setAnchorEl}) {
  const navigate = useNavigate()
  const thisRef = useRef()

  const handleOpenFile = ()=> {
    navigate("/file/"+docId)
  }

  const handleOpenMenu = (e)=> {
    e.preventDefault()
    setAnchorEl(thisRef.current)
  }

  return (
    <div className="text-center w-32 m-2 relative select-none" docid={docId} type="file" ref={thisRef} onContextMenu={handleOpenMenu} onDoubleClick={handleOpenFile}>
      <div className="absolute w-full h-full"></div>
      <img src="/file.png" className="w-fit h-24 inline-block" alt="file icon" />
      <span>{name}</span>
    </div>
  )
}
