import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { addDoc, collection, deleteDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, storage } from "../../services/firebase";
import { errorHandler } from "../../services/utils";

export function FileUploadDialog({ open, setOpen, path }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [limit, setLimit] = useState(false);
  const [user] = useAuthState(auth);

  const handleDialogClose = () => {
    setOpen(false);
  };

  const handleFileSubmit = async () => {
    if (selectedFile) {
      const doc = await addDoc(collection(db, "Files"), {
        filename: selectedFile.name,
        owner: user.uid,
        path: path,
        type: selectedFile.type,
        isPublic : false,
        domains : [],
        shared: []
      });

      const uploadTask = uploadBytesResumable(storageRef(storage, user.uid + "/" + doc.id), selectedFile, {
        contentType: selectedFile.type
      });

      uploadTask.on(`state_changed`, (snapshot) => {

        const progressSnap = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progressSnap);

        switch (snapshot.state) {
          case 'paused':
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }

      }, 
      async (err)=> {
        errorHandler(err)
        setSelectedFile(null);
        setOpen(false);
        setProgress(null);

        await deleteDoc(doc(db, "Files", doc.id))
      },
      () => {
        setSelectedFile(null);
        setOpen(false);
        setProgress(null);
      });
    }
  };

  return <>
    <Dialog open={open} onClose={handleDialogClose}>
      <DialogTitle>Upload File</DialogTitle>
      <DialogContent>
        {progress && <CircularProgress className="my-2 ml-4" variant="determinate" value={progress} />}
        <input
          className="block my-2"
          type="file"
          onChange={(e) => {
            const file = e.target.files ? e.target.files[0] : undefined;
            setSelectedFile(file);
            if ((file.size / 1024 / 1024) > 10)
              setLimit(true);
            else
              setLimit(false);
          }} />
        { limit ? <span className="text-red-600 block mt-2">Max File size is 10MB</span> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleFileSubmit} disabled={limit}>Submit</Button>
      </DialogActions>
    </Dialog>
  </>;
}
