import { Dialog, DialogTitle, List, ListItem, ListItemAvatar, Avatar, ListItemText, TextField, DialogContent, Button, FormControlLabel, Checkbox, DialogActions } from "@mui/material"
import { Person, Add } from "@mui/icons-material"
import { blue } from '@mui/material/colors';
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function ShareDialog({ handleClose, open, emails, file_id, is_Public }) {
  const [isPublic, setIsPublic] = useState(is_Public)
  const [shared_emails, setShared_emails] = useState(emails)
  const [inpValue, setInpValue] = useState("")

  const handleShare = async ()=> {
    await updateDoc(doc(db, "Files", file_id), {
      shared : shared_emails,
      isPublic : isPublic
    })
    handleClose()
  }

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Add Person to Share</DialogTitle>
      <List sx={{ pt: 0 }}>
        {shared_emails.map((email) => (
          <ListItem key={email}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
                <Person />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={email} />
          </ListItem>
        ))}
      </List>
      <DialogContent>
        <FormControlLabel control={
          <Checkbox 
            checked={isPublic}
            onChange={()=>{
              isPublic ? setIsPublic(false)
              : setIsPublic(true)
            }}
            inputProps={{ 'aria-label': 'controlled' }} 
          />
        } label="Set to Public" />
        <TextField
          disabled={isPublic}
          autoFocus
          margin="dense"
          id="name"
          label="Email Address"
          type="email"
          fullWidth
          variant="outlined"
          value={inpValue}
          onChange={(e)=>setInpValue(e.target.value)}
        />
        <Button 
          disabled={isPublic}
          variant="contained" 
          fullWidth 
          onClick={()=>{
            setShared_emails([...shared_emails, inpValue])
            setInpValue("")
          }}
        >Add</Button>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleShare}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
