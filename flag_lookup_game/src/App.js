import "./App.css";
import NavBar from "./components/NavBar/NavBar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from './auth';
import { About } from "./components/Pages/About";
import { Contact } from "./components/Pages/contacts";
import { Game } from "./components/Game/game";
import CountriesInfo from "./components/countriesInfo/CountriesInfo";
import  AllCountries  from "./components/Countries/AllCountries"
function App() {
  return (
    <>
     <AuthProvider> 
      <Router>
        <NavBar />

        <div className="pages">
          <Routes>
            <Route path="/" element={<AllCountries />} />
            <Route path="/country/:countryName" element={<CountriesInfo />} />
            <Route path="/logout" element={<About />} />
            <Route path="/login" element={<Contact />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </div>
      </Router>
      </AuthProvider>
    </>
  );
}

export default App;
