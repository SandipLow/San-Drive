import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import Files from "../components/Files/Files";
import { auth } from "../services/firebase";

export default function Home() {
  const navigate = useNavigate()
  const [user, loading, error] = useAuthState(auth)

  useEffect(()=> {
    if (loading) return
    if (!user) {
      alert("Have to Log In First")
      navigate("/auth")
    }
  }, [loading])

  return (
    <Files/>
  )
}


