import React from 'react';
import Enigma from "./Enigma";
import './stylesheets/App.css';
import {CookiesProvider} from "react-cookie";

function App() {
    return (
        <CookiesProvider>
            <Enigma />
        </CookiesProvider>
    );
}

export default App;
