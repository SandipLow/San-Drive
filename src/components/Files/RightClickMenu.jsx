import { Menu, MenuItem } from "@mui/material";
import { collection, deleteDoc, doc, getDocsFromCache, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useState } from "react";
import { auth, db, storage } from "../../services/firebase";
import ShareDialog from "../ShareDialog";

export function RightClickMenu({ open, anchorEl, setAnchorEl, emails }) {
  const [shareDialOpen, setShareDialOpen] = useState(false)

  const handleClose = () => {
    setShareDialOpen(false)
    setAnchorEl(null);
  };

  const handleRename = () => {
    const docId = anchorEl.getAttribute("docid");
    const newName = prompt("Enter new name :");
    if (!newName)
      return;

    updateDoc(doc(db, "Files", docId), {
      filename: newName
    }).then(res => {
      handleClose();
    });
  };

  const handleDelete = ()=> {
    const docId = anchorEl.getAttribute("docid");
    const folder = (anchorEl.getAttribute("type") == "folder")

    deleteDoc(doc(db, "Files", docId)).then(()=>{
      // For File Delete the object only from storage
      if(!folder) {
        deleteObject(ref(storage, auth.currentUser.uid+"/"+docId)).then(()=>{
          handleClose();
        })
      }
      // For Folder Delete inside content as well
      else {
        const path = anchorEl.getAttribute("path")
        const batch = writeBatch(db)
        const deleteIds = [];
        const q = query(collection(db, "Files"), where("owner", "==", auth.currentUser.uid))

        getDocsFromCache(q).then(snapshot=>{
          
          snapshot.docs.forEach(doc=>{
            if(doc.data().path.startsWith(path)) deleteIds.push(doc.id)
          })

          deleteIds.forEach( async (id)=>{
            batch.delete(doc(db, "Files", id))
            await deleteObject(ref(storage, auth.currentUser.uid+"/"+id))
          })

          batch.commit()
        })
      }
    })

  }

  return (<>
    <Menu
      id="basic-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      MenuListProps={{
        'aria-labelledby': 'basic-button',
      }}
    >
      <MenuItem onClick={handleRename}>Rename</MenuItem>
      <MenuItem onClick={handleDelete}>Delete</MenuItem>
      <MenuItem onClick={handleClose}>Move</MenuItem>
      <MenuItem onClick={handleClose}>Share</MenuItem>
    </Menu>
    <ShareDialog open={shareDialOpen} handleClose={handleClose} emails={emails} />
  </>);
}
