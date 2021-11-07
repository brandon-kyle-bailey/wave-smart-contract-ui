import React, {useEffect, useState} from "react";
import {ethers} from "ethers";
import './App.css';

import abi from './utils/WavePortalContract.json';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveMessage, setWaveMessage] = useState("");
  const contractAddress = "0x4A4f46AD8b3a71F5680695a54D87FeB99161AA1A";
  const contractABI = abi.abi;
  const checkIfAccountAuthorized = async (ethereum) => {
    const accounts = await ethereum.request({method: 'eth_accounts'});
    if(accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found.");
    }

  }
  const checkIfWalletIsConnected = async () => {
    try {
      const {ethereum} = window;
      if(!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      await checkIfAccountAuthorized(ethereum);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message, reward) => {
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
          reward: ethers.utils.formatEther(reward),
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const wave = async () => {
    console.log("Waving...");
    try {
      const {ethereum} = window;
      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const WavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        let count = await WavePortalContract.getTotalWaves();
        console.log(`Retrieved total wave count... ${count.toNumber()}`);

        const waveTxn = await WavePortalContract.wave(waveMessage, { gasLimit: 300000 });
        console.log(`Mining... ${waveTxn.hash}`);
        await waveTxn.wait();
        console.log(`Mined -- ${waveTxn.hash}`);

        count = await WavePortalContract.getTotalWaves();
        console.log(`Retrieved total wave count... ${count.toNumber()}`);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
      }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;
      if(!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({method: "eth_requestAccounts"});
      console.log("Connected ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const getAllWaves = async () => {
    try {
      const {ethereum} = window;
      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const WavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await WavePortalContract.getAllWaves();

        let cleanedWaves = [];
        waves.forEach(wave => {
          console.log(wave);
          cleanedWaves.push({address:wave.waver, timestamp: new Date(wave.timestamp * 1000), message: wave.message, reward: wave.reward});
        });
        setAllWaves(cleanedWaves);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="waving hand">👋</span> Hey there!
        </div>

        <div className="bio">
        My name is Brandon. Connect your Ethereum wallet and wave at me!
        </div>

        {currentAccount && (
          <div className="dataContainer">
            <input className="waveButton waveMessageInput" type="text" id="waveMessage" name="waveMessage" placeholder="Write a message!" onChange={(e) => setWaveMessage(e.target.value)}></input>
            <button className="waveButton" onClick={wave}>Wave!</button>
          </div>
        )}

        {!currentAccount && (
          <button className="connectButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
              <div>Reward: {wave.reward.toString()} ETH</div>
            </div>)
        })}
      </div>
    </div>
  );
}
