import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Auth from "./pages/Auth"
import RootLayout from "./pages/Root";
import Home from "./pages/Home";
import DisplayFile, {loader as fileLoader} from "./pages/DisplayFile";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<RootLayout/>}>

      <Route index element={<Home/>} />
      <Route path='/file/:fileId' element={<DisplayFile/>} loader={fileLoader} />
      <Route path='/auth' element={<Auth/>} />

    </Route>
  )
)

function App() {

  return (
    <>
    <RouterProvider router={router} />
    </>
  )
}

export default App
