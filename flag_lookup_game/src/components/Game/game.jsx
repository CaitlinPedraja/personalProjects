import React, { useState, useEffect } from "react";
import { apiURL } from "../util/api";
import SearchInput from "../Search/SearchInput";
import {useAuth} from '../../auth';
import axios from "axios";
import "./game.css";

export const Game = () => {
    const [countries, setCountries] = useState([]);
    const [randomCountries, setRandomCountries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [gameStarted, setGameStarted] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const { user  } = useAuth();
    //api call 
    const getAllCountries = async () => {
        try {
            const res = await fetch(`${apiURL}/all`);

            if (!res.ok) throw new Error("Something went wrong!");

            const data = await res.json();
            setCountries(data);

            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            setError(error.message);
        }
    };

    // Function to generate an array of random countries
    const getRandomCountries = (count) => {
        const randomIndices = [];
        while (randomIndices.length < count) {
            const randomIndex = Math.floor(Math.random() * countries.length);
            if (!randomIndices.includes(randomIndex)) {
                randomIndices.push(randomIndex);
            }
        }
        const randomCountries = randomIndices.map((index) => countries[index]);
        setRandomCountries(randomCountries);
    
    };

    // Check user's answers
    const getCountryByName = (countryName, index) => {
        if (countryName === randomCountries[index].name.common) {
            setCorrectCount((prevCount) => prevCount + 1);
  
            console.log("Correct!");
        } else {
            console.log("Incorrect!");

        }
    };

    useEffect(() => {
        getAllCountries();
    }, []);

    useEffect(() => {
        if (countries.length > 0) {
            getRandomCountries(12); // Get 12 random countries
        }
    }, [countries]);

    const handleStartGame = () => {
        if (user){
        setGameStarted(true); 
        getRandomCountries(12);
        setCorrectCount(0);
        }else{
            alert("You must be logged in to play");
        }
    };
    const handleEndGame = async () => {
        setGameStarted(false); 
        setRandomCountries([]);
       
        try {
            const getScoreResponse = await axios.post('/high_score', { username: user.username, score: correctCount });
            const { response } = getScoreResponse.data;
            alert(`Congratulations! You got ${correctCount}/12 correct. ${response}`);
            setCorrectCount(0);
        } catch (error) {
            console.error('Error updating high score:', error);
            alert('Failed to update high score. Please try again.');
        }

        setCorrectCount(0);
        

    };

    return (         
        <div className="all__country__wrapper">
            <div className="game_top">
                <h5> {correctCount}/12</h5>
                <h3> Guess the Countries </h3>

                {!gameStarted && (
                    <div className="start_button"> 
                        <button style={{ width: '80px', height: '30px' }} onClick={handleStartGame}>Start</button>
                    </div>
                )}
                {gameStarted && (
                    <div className="start_button"> 
                        <button style={{ width: '80px', height: '30px' }} onClick={handleEndGame}>End</button>
                    </div>
                )}
            </div>
            <div className="country__bottom">
                {isLoading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    gameStarted && randomCountries.map((country, index) => (
                        <div className="country__card" key={index}>
                            <div className="country__img">
                                <img src={country.flags.png} alt="" />
                            </div>
                            <div className="country__data">
                                <SearchInput onSearch={(countryName) => getCountryByName(countryName, index)} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
